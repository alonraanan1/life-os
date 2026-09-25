import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {todayKey} from '../lib/life-model.ts';

// Run the production handlers and upsert helper, replacing only infrastructure
// (D1, authentication and storage reads). No live database or credentials.
const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const infrastructure=moduleUrl(`
  export const state={records:[],changes:1,writes:[],authorized:true};
  export const json=(data,status=200)=>Response.json(data,{status});
  export const database=()=>({prepare:sql=>({bind:(...args)=>({run:async()=>{
    state.writes.push({sql,args});return {meta:{changes:state.changes}};
  }})})});
  export const digest=async value=>value;
  export const equal=async (a,b)=>state.authorized && a===b;
  export const secret=()=> 'test-token';
  export const allRecords=async()=>state.records;
  export const oneRecord=async id=>state.records.find(r=>r.id===id)||null;
`);
const {state}=await import(infrastructure);
const model=new URL('../lib/life-model.ts',import.meta.url).href;
async function compile(path,imports){
  const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from ['"]([^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(imports[name]||name));
  return moduleUrl(code);
}
const shortcuts=await compile('lib/shortcuts.ts',{'./auth':infrastructure,'./life-store':infrastructure});
const {upsert}=await import(shortcuts);
const {database}=await import(infrastructure);
const routes={};
for(const name of ['habit-mark','hub','checkin','sleep','goal-progress','task','expense','expense/pending','habits/pending']){
  routes[name]=await import(await compile('app/api/'+name+'/route.ts',{
    '@/lib/auth':infrastructure,'@/lib/life-store':infrastructure,
    '@/lib/life-model':model,'@/lib/shortcuts':shortcuts,
  }));
}
const habit={id:'h',kind:'habit',version:1,deletedAt:null,data:{title:'vitamins',emoji:'x',days:[0,1,2,3,4,5,6],startDate:'2026-01-01',target:3}};
const entry=data=>({id:'entry:h:'+todayKey(),kind:'habitEntry',version:1,deletedAt:null,data:{habitId:'h',date:todayKey(),...data}});
const post=(name,body,query='')=>routes[name].POST(new Request('https://life.test/api/'+name+query,{
  method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify(body),
}));
const get=name=>routes[name].GET(new Request('https://life.test/api/'+name,{headers:{Authorization:'Bearer test-token'}}));
const written=()=>JSON.parse(state.writes.at(-1).args[state.writes.at(-1).sql.startsWith('UPDATE')?0:2]);
test.beforeEach(()=>{state.records=[habit];state.changes=1;state.writes=[];state.authorized=true;});

test('charging choices list each unmarked vitamin separately and include missing sleep',async()=>{
  state.records=[{...habit,data:{...habit.data,title:'ויטמינים',steps:['מגנזיום','אבץ','תוסף']}},entry({count:1,done:false,stepsDone:[1]})];
  const response=await get('habits/pending');
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).choices,['ויטמינים: מגנזיום','ויטמינים: תוסף','שינה']);
});

test('selected vitamin is marked without clearing an already marked vitamin',async()=>{
  state.records=[{...habit,data:{...habit.data,title:'ויטמינים',steps:['מגנזיום','אבץ','תוסף']}},entry({count:1,done:false,stepsDone:[1]})];
  const response=await post('habits/pending',{choice:'ויטמינים: מגנזיום'});
  assert.equal(response.status,200);
  assert.deepEqual(written().stepsDone,[0,1]);
  assert.equal(written().done,false);
});

test('selected numeric habit advances once; sleep is delegated to its shortcut',async()=>{
  state.records=[habit,entry({count:1,done:false})];
  assert.equal((await post('habits/pending',{choice:'vitamins — נשארו 2 מתוך 3'})).status,200);
  assert.equal(written().count,2);
  assert.equal((await post('habits/pending',{choice:'שינה'})).status,400);
});

test('charging choices are empty when all due habits and sleep are recorded',async()=>{
  state.records=[habit,entry({count:3,done:true}),{id:'sleep:'+todayKey(),kind:'sleep',deletedAt:null,data:{date:todayKey(),score:80,hours:7,note:''}}];
  assert.deepEqual((await (await get('habits/pending')).json()).choices,[]);
});

test('legacy habit shortcut increments toward the target and stays complete on repeat',async()=>{
  for(let count=1;count<=4;count++){
    const response=await post('habit-mark',{title:'vitamins'});
    assert.equal(response.status,200);
    const data=written();
    assert.equal(data.count,Math.min(count,3));
    assert.equal(data.done,count>=3);
    state.records=[habit,entry(data)];
  }
});
test('both shortcut entrypoints preserve previously checked named steps',async()=>{
  for(const route of ['habit-mark','hub']){
    state.records=[{...habit,data:{...habit.data,steps:['a','b','c']}},entry({count:1,done:false,stepsDone:[2]})];
    const response=await post(route,route==='hub'?{choice:'הרגל: vitamins',value:'1'}:{title:'vitamins'});
    assert.equal(response.status,200);
    assert.deepEqual(written().stepsDone,[0,2]);
    assert.equal(written().done,false);
  }
});
test('deleted habit progress starts fresh and a single-target habit remains idempotent',async()=>{
  state.records=[{...habit,data:{...habit.data,target:1}},{...entry({count:3,done:true}),deletedAt:'2026-01-01'}];
  await post('habit-mark',{title:'vitamins'});
  assert.equal(written().count,1);
  assert.equal(written().done,true);
});
test('all updating shortcuts return 409 when the database rejects their version',async()=>{
  state.changes=0;
  state.records.push(entry({count:1,done:false}),{id:'g',kind:'goal',version:1,deletedAt:null,data:{title:'goal',target:10,current:1,unit:'x',date:''}});
  for(const [route,body] of [
    ['habit-mark',{title:'vitamins'}],['hub',{choice:'הרגל: vitamins',value:'1'}],
    ['checkin',{mood:3}],['sleep',{score:80}],['goal-progress',{title:'goal',delta:1}],
  ]){
    const response=await post(route,body);
    assert.equal(response.status,409,route);
    assert.equal((await response.json()).error,'record_conflict');
  }
  const plain=await post('hub',{choice:'הרגל: vitamins'},'?plain=1');
  assert.equal(plain.status,409);
  assert.match(await plain.text(),/נסה שוב/);
});
test('idempotent task duplicates still return 200 and created:false',async()=>{
  state.changes=0;
  const response=await post('task',{title:'task',externalId:'same'});
  assert.equal(response.status,200);
  assert.equal((await response.json()).created,false);
  await assert.rejects(upsert(database(),'h','habit',{},1,true),/record_conflict/);
});
test('anonymous shortcut requests never write',async()=>{
  state.authorized=false;
  assert.equal((await post('habit-mark',{title:'vitamins'})).status,401);
  assert.equal(state.writes.length,0);
});
test('sleep shortcut accepts separate hour and minute fields and rejects an 80-minute value',async()=>{
  const response=await post('sleep',{score:83,hours:6,minutes:48});
  assert.equal(response.status,200);
  assert.equal(written().hours,6.8);
  state.writes=[];
  const invalid=await post('sleep',{score:83,hours:6,minutes:80});
  assert.equal(invalid.status,400);
  assert.equal(state.writes.length,0);
});
test('automatic Wallet and bank charges are correctly owned and queued for review',async()=>{
  for(const [source,funder] of [['wallet','dad'],['bank','me']]){
    state.writes=[];
    const response=await post('expense',{source,amount:42.7,merchant:'בית קפה',externalId:source+'-event'});
    assert.equal(response.status,201);
    assert.equal(written().funder,funder);
    assert.equal(written().category,'לבירור');
    assert.equal(written().reviewStatus,'pending');
    assert.equal(written().location,source==='wallet'?'בית קפה':'');
    assert.equal(written().amount,4270);
  }
  state.writes=[];
  assert.equal((await post('expense',{source:'bank',amount:20,merchant:'x'})).status,400,'bank intake requires an idempotency key');
  assert.equal((await post('expense',{source:'bank',amount:20,externalId:'price-only'})).status,400,'bank intake still requires a merchant');
  assert.equal(state.writes.length,0);
});
test('Wallet amount is recorded for review even without merchant or external id',async()=>{
  const response=await post('expense',{source:'wallet',amount:'₪20.50'});
  assert.equal(response.status,201);
  assert.deepEqual(await response.json().then(({created,needsReview})=>({created,needsReview})),{created:true,needsReview:true});
  assert.equal(written().title,'חיוב ללא בית עסק');
  assert.equal(written().amount,2050);
  assert.equal(written().funder,'dad');
  assert.equal(written().reviewStatus,'pending');
  assert.equal(written().location,'');
  state.writes=[];
  assert.equal((await post('expense',{source:'wallet',amount:20,merchant:'בית קפה'})).status,201);
  assert.equal(written().title,'בית קפה');
  assert.equal(written().location,'בית קפה');
  state.writes=[];
  assert.equal((await post('expense',{source:'wallet',amount:20,externalId:'tap-1'})).status,201);
  assert.equal(state.writes[0].args[0],'shortcut:wallet:tap-1');
  state.writes=[];
  assert.equal((await post('expense',{source:'wallet',merchant:'בית קפה'})).status,400,'a charge still needs an amount');
  assert.equal(state.writes.length,0);
});
test('review queue is silent when empty and exposes only pending automatic charges',async()=>{
  assert.deepEqual(await (await get('expense/pending')).json(),{count:0,items:[]});
  state.records=[habit,
    {id:'pending',kind:'transaction',version:2,deletedAt:null,data:{title:'בית קפה',category:'לבירור',location:'בית קפה',date:todayKey(),amount:4270,direction:'expense',funder:'dad',reviewStatus:'pending'}},
    {id:'done',kind:'transaction',version:1,deletedAt:null,data:{title:'x',category:'אוכל',date:todayKey(),amount:100,direction:'expense',reviewStatus:'complete'}}];
  const response=await get('expense/pending');
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.count,1);
  assert.equal(body.items[0].id,'pending');
  assert.deepEqual(body.items[0].missing,['category']);
});
test('review completion requires all details and rejects stale edits',async()=>{
  state.records=[habit,{id:'pending',kind:'transaction',version:2,deletedAt:null,data:{title:'חיוב ללא בית עסק',category:'לבירור',location:'',date:todayKey(),amount:4270,direction:'expense',funder:'dad',reviewStatus:'pending'}}];
  assert.equal((await post('expense/pending',{id:'pending',version:2,complete:true})).status,400);
  assert.equal(state.writes.length,0);
  assert.equal((await post('expense/pending',{id:'pending',version:1,description:'קפה',category:'אוכל',location:'בית קפה',complete:true})).status,409);
  assert.equal(state.writes.length,0);
  const response=await post('expense/pending',{id:'pending',version:2,description:'קפה',category:'אוכל',location:'בית קפה',complete:true});
  assert.equal(response.status,200);
  assert.equal(written().reviewStatus,'complete');
  assert.equal(written().location,'בית קפה');
});
