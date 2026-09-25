import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import ts from 'typescript';

// Exercise the production component with React, the same way use-life.test.mjs
// does for the provider: Node's type stripper does not compile TSX, so the
// source is transpiled once and evaluated as a data: module.
const source=await readFile(new URL('../components/life/sleep-chart.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["'](react(?:\/jsx-runtime)?)["']/g,(_,specifier)=>
  'from '+JSON.stringify(import.meta.resolve(specifier)))
  .replace(/from ["']@\/lib\/life-model["']/g,()=>'from '+JSON.stringify(new URL('../lib/life-model.ts',import.meta.url).href));
const {SleepChart}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

function night(date,score,hours){
  return {id:'sleep:'+date,kind:'sleep',data:{date,score,hours,note:''},version:1,createdAt:date+'T10:00:00.000Z',updatedAt:date+'T10:00:00.000Z',deletedAt:null};
}

// jsdom has no ResizeObserver; this stub reports a fixed plot width the
// moment the chart observes its container, matching what the real browser
// does asynchronously but synchronously enough for a single act() to settle.
class StubResizeObserver{
  constructor(cb){this.cb=cb;}
  observe(){this.cb([{contentRect:{width:700}}]);}
  disconnect(){}
}

async function mount(t,nights){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://life.test'});
  const originals=new Map();
  const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true,ResizeObserver:StubResizeObserver};
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
  await act(async()=>root.render(createElement(SleepChart,{nights})));
  const container=document.getElementById('root');
  return {
    container,
    async click(index){
      const button=container.querySelectorAll('.chart-hits button')[index];
      await act(async()=>button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
    },
  };
}

test('fewer than two nights renders nothing',async t=>{
  const {container}=await mount(t,[night('2026-09-01',70,7)]);
  assert.equal(container.innerHTML,'');
});

test('renders one combined chart, not two separate panels',async t=>{
  const {container}=await mount(t,[night('2026-09-01',70,7),night('2026-09-02',0,8)]);
  assert.equal(container.querySelectorAll('svg').length,1);
});

test('a night missing its score has no dot, and a night missing its hours has no bar',async t=>{
  const nights=[
    night('2026-09-01',70,7),
    night('2026-09-02',0,8),   // score missing
    night('2026-09-03',85,0),  // hours missing
    night('2026-09-04',60,6),
  ];
  const {container}=await mount(t,nights);
  assert.equal(container.querySelectorAll('.chart-dot').length,3,'one dot per night with a real score');
  assert.equal(container.querySelectorAll('rect.chart-bar').length,3,'one bar per night with real hours');
});

test('the score line breaks across a missing night instead of bridging it',async t=>{
  const nights=[
    night('2026-09-01',70,7),
    night('2026-09-02',0,8),   // gap in the score series
    night('2026-09-03',85,5),
    night('2026-09-04',60,6),
  ];
  const {container}=await mount(t,nights);
  const path=container.querySelector('path.chart-line').getAttribute('d');
  assert.equal((path.match(/M/g)||[]).length,2,'one path segment before the gap, one after');
});

test('both series carry their own labeled, unmerged axis',async t=>{
  const {container}=await mount(t,[night('2026-09-01',70,7),night('2026-09-02',82,8)]);
  const legend=container.querySelector('.sleep-legend').textContent;
  assert.match(legend,/ציון שינה/);
  assert.match(legend,/שעות שינה/);
});

test('hovering/clicking a night updates the readout without inventing a missing value',async t=>{
  const nights=[
    night('2026-09-01',70,7),
    night('2026-09-02',0,8),
    night('2026-09-03',85,0),
  ];
  const mounted=await mount(t,nights);
  await mounted.click(2);
  const readout=mounted.container.querySelector('.sleep-readout').textContent;
  assert.match(readout,/85/);
  assert.match(readout,/—/,'the missing hours value reads as a dash, never a number');
});
