import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// The import route and the Data page's restore, with only their infrastructure
// replaced, as in hub-steps.test.mjs.
const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const auth=moduleUrl(`
  export const state={batches:[]};
  export const json=(data,status=200)=>Response.json(data,{status});
  export const sameOrigin=()=>true,authenticated=async()=>true;
  export const database=()=>({prepare:sql=>({bind:(...args)=>({sql,args})}),batch:async statements=>{state.batches.push(statements);return statements.map(()=>({meta:{changes:1}}));}});
`);
const stubs=moduleUrl(`export const useLife=()=>({}),select=()=>[],Editor=()=>null,Field=()=>null,Empty=()=>null,field=()=>'';`);
const model=new URL('../lib/life-model.ts',import.meta.url).href;
async function compile(path,imports){
  const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
  return moduleUrl(ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from ['"]([^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(imports[name]||import.meta.resolve(name))));
}
const route=await import(await compile('app/api/import/route.ts',{'@/lib/auth':auth,'@/lib/life-model':model}));
const {restoreBackup}=await import(await compile('components/life/data.tsx',{'@/lib/life-model':model,'./use-life':stubs,'./editor':stubs}));
const {state}=await import(auth);

test('a restored record keeps its original creation time when the file has a valid one',async()=>{
  state.batches=[];
  const habit=(id,createdAt)=>({id,kind:'habit',createdAt,data:{title:'מים',emoji:'💧',days:[0,1,2,3,4,5,6],startDate:'2026-01-01'}});
  const response=await route.POST(new Request('https://life.test/api/import',{method:'POST',body:JSON.stringify({format:'life-os',schemaVersion:1,records:[habit('a','2026-01-05T08:00:00.000Z'),habit('b','not a date')]})}));
  assert.equal(response.status,200);
  const [first,second]=state.batches[0];
  assert.equal(first.args[3],'2026-01-05T08:00:00.000Z');
  assert.notEqual(second.args[3],'not a date');
  assert.ok(Number.isFinite(Date.parse(second.args[3])));
});

test('a backup goes up in chunks of 40, and a failed chunk says how far it got',async t=>{
  const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
  const sizes=[];let failOn=0;
  globalThis.fetch=async(_,init)=>{const records=JSON.parse(init.body).records;sizes.push(records.length);return sizes.length===failOn?Response.json({error:'הייבוא לא הצליח. נסה שוב.'},{status:503}):Response.json({imported:records.length});};
  const file=JSON.stringify({format:'life-os',schemaVersion:1,exportedAt:'2026-09-26',records:Array.from({length:85},(_,i)=>({id:'r'+i}))});
  assert.equal(await restoreBackup(file),85);
  assert.deepEqual(sizes,[40,40,5]);
  sizes.length=0;failOn=2;
  await assert.rejects(restoreBackup(file),/אחרי 40 רשומות/);
  assert.deepEqual(sizes,[40,40]);
});
