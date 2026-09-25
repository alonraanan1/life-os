import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import ts from 'typescript';
import {todayKey} from '../lib/life-model.ts';

const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const storeURL=moduleURL(`export const store={records:[],writes:[],save:async(...args)=>store.writes.push(args)};
export const useLife=()=>store;
export const select=(records,kind)=>records.filter(r=>r.kind===kind&&!r.deletedAt);`);
const stubsURL=moduleURL('export const tap=()=>{},Editor=()=>null,Empty=()=>null,Field=()=>null,SleepView=()=>null,HabitTrends=()=>null,field="";');
const source=await readFile(new URL('../components/life/habits.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["']([^"']+)["']/g,(_,specifier)=>{
  const resolved=specifier==='@/lib/life-model'?new URL('../lib/life-model.ts',import.meta.url).href
    :specifier==='./use-life'?storeURL
    :['@/lib/haptics','./editor','./sleep','./habit-trends'].includes(specifier)?stubsURL
    :import.meta.resolve(specifier);
  return 'from '+JSON.stringify(resolved);
});
const {HabitsView}=await import(moduleURL(compiled));
const {store}=await import(storeURL);

test('weekly history click preserves the identity of already completed named steps',async t=>{
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://life.test'});
  const originals=new Map();
  for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  }
  const root=createRoot(document.getElementById('root'));
  t.after(async()=>{
    await act(async()=>root.unmount());
    dom.window.close();
    for(const [key,descriptor] of originals){
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);
      else delete globalThis[key];
    }
  });
  const date=todayKey(),habitId='vitamins',id='entry:'+habitId+':'+date;
  const record=(id,kind,data)=>({id,kind,data,version:1,createdAt:date,updatedAt:date,deletedAt:null});
  store.records=[record(habitId,'habit',{title:'ויטמינים',emoji:'🌱',days:[0,1,2,3,4,5,6],startDate:'2026-01-01',steps:['א','ב','ג']}),
    record(id,'habitEntry',{habitId,date,count:1,done:false,stepsDone:[2]})];
  store.writes=[];
  await act(async()=>root.render(createElement(HabitsView)));
  const today=document.querySelector('.habit-history button[aria-current="date"]');
  assert.ok(today);
  assert.equal(today.disabled,false);
  await act(async()=>today.click());
  assert.equal(store.writes.length,1);
  assert.deepEqual(store.writes[0][1],{habitId,date,done:false,count:2,stepsDone:[0,2]});
});
