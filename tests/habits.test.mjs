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
const stubsURL=moduleURL('export const tap=()=>{},Editor=()=>null,Empty=()=>null,Field=()=>null,field="",Sheet=({children})=>children(()=>{});');
const source=await readFile(new URL('../components/life/habits.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["']([^"']+)["']/g,(_,specifier)=>{
  const resolved=specifier==='@/lib/life-model'?new URL('../lib/life-model.ts',import.meta.url).href
    :specifier==='./use-life'?storeURL
    :['@/lib/haptics','./editor'].includes(specifier)?stubsURL
    :import.meta.resolve(specifier);
  return 'from '+JSON.stringify(resolved);
});
const {HabitsView}=await import(moduleURL(compiled));
const {store}=await import(storeURL);

const date=todayKey();
const record=(id,kind,data)=>({id,kind,data,version:1,createdAt:date,updatedAt:date,deletedAt:null});
const daily=(id,title,extra={})=>record(id,'habit',{title,emoji:'🌱',days:[0,1,2,3,4,5,6],startDate:'2026-01-01',...extra});

async function mount(t,records){
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
  store.records=records;store.writes=[];
  await act(async()=>root.render(createElement(HabitsView)));
}

test('weekly history click preserves the identity of already completed named steps',async t=>{
  const habitId='vitamins',id='entry:'+habitId+':'+date;
  await mount(t,[daily(habitId,'ויטמינים',{steps:['א','ב','ג']}),record(id,'habitEntry',{habitId,date,count:1,done:false,stepsDone:[2]})]);
  const today=document.querySelector('.habit-history button[aria-current="date"]');
  assert.ok(today);
  assert.equal(today.disabled,false);
  await act(async()=>today.click());
  assert.equal(store.writes.length,1);
  assert.deepEqual(store.writes[0][1],{habitId,date,done:false,count:2,stepsDone:[0,2]});
});

test('a day that loads already complete does not celebrate',async t=>{
  await mount(t,[daily('a','א'),record('entry:a:'+date,'habitEntry',{habitId:'a',date,done:true,count:1})]);
  assert.equal(document.querySelector('.habit-cheer'),null);
  assert.match(document.querySelector('.habit-summary').textContent,/יום מושלם/);
});

test('the tap that completes the last due habit celebrates',async t=>{
  await mount(t,[daily('a','א'),daily('b','ב'),record('entry:a:'+date,'habitEntry',{habitId:'a',date,done:true,count:1})]);
  assert.equal(document.querySelector('.habit-cheer'),null);
  await act(async()=>document.querySelector('[aria-label="סימון ב"]').click());
  assert.ok(document.querySelector('.habit-cheer'));
});

test('before the first habit, only the empty state shows',async t=>{
  await mount(t,[]);
  assert.equal(document.querySelector('.habit-toolbar'),null);
  assert.equal(document.querySelector('.habit-summary'),null);
});

test('an edited habit keeps its place in the list',async t=>{
  const first={...daily('a','ראשון'),createdAt:'2026-01-01T00:00:00.000Z'},second={...daily('b','שני'),createdAt:'2026-01-02T00:00:00.000Z'};
  // The store lists the record saved last first.
  await mount(t,[{...second,version:2},first]);
  assert.deepEqual([...document.querySelectorAll('.habit-record .record-body')].map(body=>body.textContent),['ראשון','שני']);
});

test('a habit name opens its month, where a past day can be marked',async t=>{
  await mount(t,[daily('a','מים')]);
  assert.equal(document.querySelector('.habit-month'),null);
  await act(async()=>document.querySelector('.habit-open').click());
  const month=document.querySelector('.habit-month');
  const [year,number]=date.split('-').map(Number);
  assert.equal(month.querySelectorAll('button').length,new Date(Date.UTC(year,number,0)).getUTCDate());
  assert.equal(document.querySelector('[aria-label="החודש הבא"]').disabled,true);
  await act(async()=>month.querySelector('button').click());
  assert.equal(store.writes.length,1);
  assert.equal(store.writes[0][1].date,date.slice(0,8)+'01');
});
