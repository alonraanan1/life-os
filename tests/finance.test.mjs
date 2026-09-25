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
// The editor stub keeps its props so a test can drive onDelete directly.
const stubsURL=moduleURL(`import {createElement} from ${JSON.stringify(import.meta.resolve('react'))};
export const Editor=props=>{globalThis.__financeEditor=props;return null;};
export const Empty=()=>createElement('p',{className:'empty-stub'});
export const Field=()=>null,field=()=>'';`);
const source=await readFile(new URL('../components/life/finance.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["']([^"']+)["']/g,(_,specifier)=>{
  const resolved=specifier==='@/lib/life-model'?new URL('../lib/life-model.ts',import.meta.url).href
    :specifier==='./use-life'?storeURL
    :specifier==='./editor'?stubsURL
    :import.meta.resolve(specifier);
  return 'from '+JSON.stringify(resolved);
});
const {FinanceView}=await import(moduleURL(compiled));
const {store}=await import(storeURL);

const month=todayKey().slice(0,7);
// Days 01–07 of the current month, so every row falls in the default month view.
const expense=day=>{const date=month+'-0'+day;return {id:'t'+day,kind:'transaction',data:{title:'חיוב '+day,category:'אחר',date,amount:1000*day,direction:'expense'},version:1,createdAt:date,updatedAt:date,deletedAt:null};};

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
  store.records=records;store.writes=[];globalThis.__financeEditor=undefined;
  await act(async()=>root.render(createElement(FinanceView)));
  return root;
}

test('the five newest transactions stay in view and the rest wait behind the disclosure',async t=>{
  await mount(t,[1,2,3,4,5,6,7].map(expense));
  const visible=[...document.querySelectorAll('section > .finance-row')];
  assert.equal(visible.length,5);
  assert.match(visible[0].textContent,/חיוב 7/);
  assert.equal(document.querySelectorAll('.finance-history .finance-row').length,2);
  assert.match(document.querySelector('.finance-history > summary').textContent,/עוד 2 תנועות/);
});

test('a row opens the editor, whose delete soft-deletes the latest copy of that transaction',async t=>{
  const original=expense(1),newer={...expense(1),version:2};
  const root=await mount(t,[original]);
  assert.equal(document.querySelector('.finance-history'),null);
  await act(async()=>document.querySelector('.finance-row').click());
  assert.equal(typeof globalThis.__financeEditor?.onDelete,'function');
  // A Shortcut rewrites the transaction while the editor is open.
  store.records=[newer];
  await act(async()=>root.render(createElement(FinanceView)));
  await act(async()=>globalThis.__financeEditor.onDelete());
  assert.equal(store.writes.length,1);
  const [kind,,existing,,remove]=store.writes[0];
  assert.equal(kind,'transaction');
  assert.equal(existing.version,2);
  assert.equal(remove,true);
});

test('the dad card shows this month and the open balance, not the charges, and pays through its own editor',async t=>{
  const dad={...expense(2),id:'d2',data:{...expense(2).data,title:'ביטוח',funder:'dad'}};
  const paid={id:'p1',kind:'dadPayment',data:{date:month+'-01',amount:500},version:1,createdAt:month+'-01',updatedAt:month+'-01',deletedAt:null};
  await mount(t,[expense(1),dad,paid]);
  const card=document.querySelector('.dad-card');
  assert.doesNotMatch(card.textContent,/ביטוח/);
  assert.match(card.querySelector('.dad-head strong').textContent,/15\.00/);
  assert.match(card.querySelector('.dad-open').textContent,/15\.00/);
  assert.equal(card.querySelectorAll('.dad-row').length,1);
  await act(async()=>card.querySelector('.quiet-action').click());
  assert.equal(globalThis.__financeEditor.title,'תשלום לאבא');
  assert.equal(globalThis.__financeEditor.onDelete,undefined);
});
