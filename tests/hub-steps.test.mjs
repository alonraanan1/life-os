import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {todayKey} from '../lib/life-model.ts';

// The hub route with only its infrastructure replaced, as in shortcuts.test.mjs.
const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const infrastructure=moduleUrl(`
  export const state={records:[],writes:[]};
  export const json=(data,status=200)=>Response.json(data,{status});
  export const database=()=>({prepare:sql=>({bind:(...args)=>({run:async()=>{state.writes.push({sql,args});return {meta:{changes:1}};}})})});
  export const digest=async value=>value;
  export const equal=async (a,b)=>a===b;
  export const secret=()=>'test-token';
  export const allRecords=async()=>state.records;
  export const oneRecord=async id=>state.records.find(r=>r.id===id)||null;
`);
const {state}=await import(infrastructure);
async function compile(path,imports){
  const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
  return moduleUrl(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from ['"]([^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(imports[name]||name)));
}
const shortcuts=await compile('lib/shortcuts.ts',{'./auth':infrastructure,'./life-store':infrastructure});
const hub=await import(await compile('app/api/hub/route.ts',{'@/lib/auth':infrastructure,'@/lib/life-store':infrastructure,'@/lib/life-model':new URL('../lib/life-model.ts',import.meta.url).href,'@/lib/shortcuts':shortcuts}));
const today=todayKey();
const vitamins={id:'v',kind:'habit',version:1,deletedAt:null,data:{title:'ויטמינים',emoji:'x',days:[0,1,2,3,4,5,6],startDate:'2026-01-01',steps:['מגנזיום','D']}};
const marked=stepsDone=>({id:'entry:v:'+today,kind:'habitEntry',version:1,deletedAt:null,data:{habitId:'v',date:today,done:false,count:stepsDone.length,stepsDone}});
const choose=choice=>hub.POST(new Request('https://life.test/api/hub',{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify({choice})}));

test('choosing a step that is already marked leaves it marked',async()=>{
  state.records=[vitamins,marked([0])];state.writes=[];
  const response=await choose('הרגל: ויטמינים: מגנזיום');
  assert.equal(response.status,200);
  assert.equal(state.writes.length,0);
  assert.match((await response.json()).message,/כבר סומן/);
});

test('choosing an unmarked step marks it and keeps the others',async()=>{
  state.records=[vitamins,marked([0])];state.writes=[];
  const response=await choose('הרגל: ויטמינים: D');
  assert.equal(response.status,200);
  const write=state.writes.at(-1);
  assert.deepEqual(JSON.parse(write.args[write.sql.startsWith('UPDATE')?0:2]).stepsDone,[0,1]);
});
