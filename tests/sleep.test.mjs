import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import ts from 'typescript';
import {dateOffset,todayKey} from '../lib/life-model.ts';

const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const storeURL=moduleURL(`export const store={records:[],writes:[],save:async(...args)=>store.writes.push(args)};
export const useLife=()=>store;
export const select=(records,kind)=>records.filter(r=>r.kind===kind&&!r.deletedAt);`);
// The editor stub keeps its props so a test can drive onDelete directly.
const stubsURL=moduleURL(`import {createElement} from ${JSON.stringify(import.meta.resolve('react'))};
export const Editor=props=>{globalThis.__sleepEditor=props;return null;};
export const Empty=()=>createElement('p',{className:'empty-stub'});
export const Field=()=>null,field=()=>'',SleepChart=()=>null;`);
const source=await readFile(new URL('../components/life/sleep.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["']([^"']+)["']/g,(_,specifier)=>{
  const resolved=specifier==='@/lib/life-model'?new URL('../lib/life-model.ts',import.meta.url).href
    :specifier==='./use-life'?storeURL
    :['./editor','./sleep-chart'].includes(specifier)?stubsURL
    :import.meta.resolve(specifier);
  return 'from '+JSON.stringify(resolved);
});
const {SleepView}=await import(moduleURL(compiled));
const {store}=await import(storeURL);

const today=todayKey();
const night=(daysAgo,score=80)=>{const date=dateOffset(today,-daysAgo);return {id:'sleep:'+date,kind:'sleep',data:{date,score,hours:7.5,note:''},version:1,createdAt:date,updatedAt:date,deletedAt:null};};

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
  store.records=records;store.writes=[];globalThis.__sleepEditor=undefined;
  await act(async()=>root.render(createElement(SleepView)));
  return root;
}

test('no nights shows the empty state and no rows',async t=>{
  await mount(t,[]);
  assert.ok(document.querySelector('.empty-stub'));
  assert.equal(document.querySelectorAll('.sleep-row').length,0);
  assert.equal(document.querySelector('.sleep-history'),null);
});

test('one night shows one row and no disclosure',async t=>{
  await mount(t,[night(0)]);
  assert.equal(document.querySelectorAll('.sleep-row').length,1);
  assert.equal(document.querySelector('.sleep-history'),null);
  assert.equal(document.querySelector('.empty-stub'),null);
});

test('the newest night stays in view and older nights sit behind the disclosure',async t=>{
  await mount(t,[night(2,60),night(0,99),night(1,70)]);
  const visible=[...document.querySelectorAll('.sleep-view > .sleep-row')];
  assert.equal(visible.length,1);
  assert.match(visible[0].textContent,/99/);
  assert.equal(document.querySelectorAll('.sleep-history .sleep-row').length,2);
});

test('a row opens the editor, whose delete soft-deletes the latest copy of that night',async t=>{
  const original=night(0),newer={...night(0),version:2};
  const root=await mount(t,[original]);
  await act(async()=>document.querySelector('.sleep-row').click());
  assert.equal(typeof globalThis.__sleepEditor?.onDelete,'function');
  // A Shortcut rewrites the night while the editor is open.
  store.records=[newer];
  await act(async()=>root.render(createElement(SleepView)));
  await act(async()=>globalThis.__sleepEditor.onDelete());
  assert.equal(store.writes.length,1);
  const [kind,,existing,,remove]=store.writes[0];
  assert.equal(kind,'sleep');
  assert.equal(existing.version,2);
  assert.equal(remove,true);
});
