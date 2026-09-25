import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import ts from 'typescript';
import {dateOffset,weekday} from '../lib/life-model.ts';

// Same approach as use-life.test.mjs/sleep-chart.test.mjs: transpile the
// production TSX once and evaluate it as a data: module, resolving its bare
// and path-aliased imports to real, resolvable specifiers first.
const source=await readFile(new URL('../components/life/habit-trends.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText
  .replace(/from ["'](react(?:\/jsx-runtime)?)["']/g,(_,specifier)=>'from '+JSON.stringify(import.meta.resolve(specifier)))
  .replace(/from ["']lucide-react["']/g,()=>'from '+JSON.stringify(import.meta.resolve('lucide-react')))
  .replace(/from ["']@\/lib\/life-model["']/g,()=>'from '+JSON.stringify(new URL('../lib/life-model.ts',import.meta.url).href));
const {HabitTrends}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

function habit(id,{title='הרגל',emoji='🌱',startDate,days,target,steps}){
  return {id,kind:'habit',data:{title,emoji,startDate,days,target,steps},version:1,createdAt:startDate+'T00:00:00.000Z',updatedAt:startDate+'T00:00:00.000Z',deletedAt:null};
}
function habitEntry(habitId,date,{count,done,stepsDone}={}){
  return {id:'entry:'+habitId+':'+date,kind:'habitEntry',data:{habitId,date,done:!!done,count,stepsDone},version:1,createdAt:date+'T00:00:00.000Z',updatedAt:date+'T00:00:00.000Z',deletedAt:null};
}

const TODAY='2026-09-20';

async function mount(t,{habits,entries,today=TODAY}){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://life.test'});
  const originals=new Map();
  const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};
  for(const [key,value] of Object.entries(globals)){
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
  await act(async()=>root.render(createElement(HabitTrends,{habits,entries,today})));
  return document.getElementById('root');
}

test('no habits renders nothing',async t=>{
  const container=await mount(t,{habits:[],entries:[]});
  assert.equal(container.innerHTML,'');
});

test('one row per habit',async t=>{
  const habits=[
    habit('a',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6]}),
    habit('b',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6]}),
  ];
  const container=await mount(t,{habits,entries:[]});
  assert.equal(container.querySelectorAll('.habit-trend-row').length,2);
});

test('a habit scheduled every day with no entries reads 0 of 14, never invents a completion',async t=>{
  const habits=[habit('a',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6]})];
  const container=await mount(t,{habits,entries:[]});
  assert.equal(container.querySelector('.habit-trend-ratio').textContent,'0/14');
  assert.equal(container.querySelector('.habit-summary-copy strong').textContent,'0%');
});

test('unscheduled days are excluded from the denominator: a once-a-week habit reads out of 2, not 14',async t=>{
  const day=weekday(TODAY);
  const habits=[habit('a',{startDate:'2026-01-01',days:[day]})];
  const container=await mount(t,{habits,entries:[]});
  assert.equal(container.querySelector('.habit-trend-ratio').textContent,'0/2');
});

test('days before the habit existed are excluded, not counted as missed',async t=>{
  const habits=[habit('a',{startDate:TODAY,days:[0,1,2,3,4,5,6]})];
  const dueOnStart=1;
  const container=await mount(t,{habits,entries:[]});
  assert.equal(container.querySelector('.habit-trend-ratio').textContent,'0/'+dueOnStart);
});

test('a partial multi-step day counts toward the denominator but not completions, and renders as partial',async t=>{
  const habits=[habit('a',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6],steps:['א','ב','ג']})];
  const yesterday=dateOffset(TODAY,-1);
  const entries=[habitEntry('a',yesterday,{count:1,done:false,stepsDone:[0]})];
  const container=await mount(t,{habits,entries});
  assert.equal(container.querySelector('.habit-trend-ratio').textContent,'0/14');
  assert.equal(container.querySelectorAll('.trend-day.partial').length,1);
  assert.equal(container.querySelectorAll('.trend-day.done').length,0);
});

test('a fully completed due day counts as done and lifts the aggregate',async t=>{
  const habits=[habit('a',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6]})];
  const entries=[habitEntry('a',TODAY,{count:1,done:true})];
  const container=await mount(t,{habits,entries});
  assert.equal(container.querySelector('.habit-trend-ratio').textContent,'1/14');
  assert.equal(container.querySelectorAll('.trend-day.done').length,1);
});

test('the aggregate combines every habit truthfully',async t=>{
  const habits=[
    habit('a',{startDate:'2026-01-01',days:[0,1,2,3,4,5,6]}), // 14 due
    habit('b',{startDate:'2026-01-01',days:[weekday(TODAY)]}), // 2 due
  ];
  const entries=[habitEntry('a',TODAY,{count:1,done:true}),habitEntry('b',TODAY,{count:1,done:true})];
  const container=await mount(t,{habits,entries});
  // 2 completed out of 16 total due days
  assert.equal(container.querySelector('.habit-summary-copy strong').textContent,Math.round(2/16*100)+'%');
  assert.equal(container.querySelector('.habit-summary-copy small').textContent,'2 מתוך 16 ימים מתוכננים');
});
