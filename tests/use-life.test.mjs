import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act,createElement,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import ts from 'typescript';

// Exercise the production provider with React, without a second implementation
// or a test-only application route. Node's type stripper does not compile TSX.
const source=await readFile(new URL('../components/life/use-life.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
  jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
}}).outputText.replace(/from ["'](react(?:\/jsx-runtime)?)["']/g,(_,specifier)=>
  'from '+JSON.stringify(import.meta.resolve(specifier)));
const {LifeProvider,useLife}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

function entry(id,kind,data){
  return {id,kind,data,version:4,createdAt:'2026-09-01T10:00:00.000Z',updatedAt:'2026-09-01T10:00:00.000Z',deletedAt:null};
}
const habitEntry=(id,count=1)=>entry(id,'habitEntry',{habitId:'habit:'+id,date:'2026-09-18',count,done:count>=3});
const transaction=(id)=>entry(id,'transaction',{title:id,date:'2026-09-18',amount:12300,direction:'expense',category:'אוכל',funder:'dad'});

async function mount(t,initial=[],{load=true}={}){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://life.test'});
  const requests=[];
  const originals=new Map();
  let current;
  const globals={window:dom.window,document:dom.window.document,Event:dom.window.Event,
    IS_REACT_ACT_ENVIRONMENT:true,
    fetch:(url,options={})=>new Promise((resolve,reject)=>{
      requests.push({url,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined,resolve,reject});
    }),
  };
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
  function Probe(){
    const store=useLife();
    useLayoutEffect(()=>{current=store;},[store]);
    return null;
  }
  await act(async()=>root.render(createElement(LifeProvider,null,createElement(Probe))));
  const harness={
    get store(){return current;},requests,
    async respond(request,body,status=200){
      await act(async()=>request.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}})));
    },
    async startSave(...args){
      /** @type {Promise<unknown>} */
      let promise;
      await act(async()=>{promise=current.save(...args);void promise.catch(()=>{});});
      return {promise,request:requests.at(-1)};
    },
    async startRefresh(){
      /** @type {Promise<unknown>} */
      let promise;
      await act(async()=>{promise=current.refresh();});
      return {promise,request:requests.at(-1)};
    },
  };
  assert.equal(requests.length,1,'mount starts the initial load');
  assert.equal(current.loading,true);
  if(load){
    await harness.respond(requests[0],{records:initial});
    assert.equal(current.loading,false);
  }
  return harness;
}

test('failed first write cancels dependent taps and removes the phantom entry',async t=>{
  const h=await mount(t,[]);
  const base={habitId:'h',date:'2026-09-18',done:false};
  const first=await h.startSave('habitEntry',{...base,count:1},undefined,'entry:h');
  const second=await h.startSave('habitEntry',{...base,count:2},h.store.records[0]);
  await h.respond(first.request,{error:'offline'},503);
  assert.equal(h.requests.filter(r=>r.method==='POST').length,1,'dependent write must not reach the server');
  await assert.rejects(first.promise,/offline/);
  await assert.rejects(second.promise,/offline/);
  assert.deepEqual(h.store.records,[]);
  assert.equal(h.store.busy,false);
});

test('failed middle write restores the last confirmed version and allows a fresh retry',async t=>{
  const a=habitEntry('a',0),h=await mount(t,[a]);
  const first=await h.startSave('habitEntry',{...a.data,count:1},a);
  const second=await h.startSave('habitEntry',{...a.data,count:2},h.store.records[0]);
  const third=await h.startSave('habitEntry',{...a.data,count:3,done:true},h.store.records[0]);
  const confirmed={...a,data:{...a.data,count:1},version:5};
  await h.respond(first.request,{record:confirmed});
  await first.promise;
  await h.respond(h.requests.at(-1),{error:'offline'},503);
  assert.equal(h.requests.filter(r=>r.method==='POST').length,2);
  await assert.rejects(second.promise,/offline/);
  await assert.rejects(third.promise,/offline/);
  assert.deepEqual(h.store.records,[confirmed]);
  const retry=await h.startSave('habitEntry',{...a.data,count:2},h.store.records[0]);
  assert.equal(retry.request.body.version,5);
  await h.respond(retry.request,{record:{...confirmed,data:{...a.data,count:2},version:6}});
  await retry.promise;
  assert.equal(h.store.records[0].version,6);
});

test('refresh requested during saves waits and loads imported records when the queue drains',async t=>{
  const a=habitEntry('a'),h=await mount(t,[a]);
  const write=await h.startSave('habitEntry',{...a.data,count:2},a);
  const refresh1=await h.startRefresh(),refresh2=await h.startRefresh();
  assert.equal(h.requests.filter(r=>r.method==='GET').length,1);
  await h.respond(write.request,{record:{...a,version:5}});
  await write.promise;
  assert.equal(h.requests.filter(r=>r.method==='GET').length,2,'deferred refreshes share one GET');
  const imported=transaction('imported');
  await h.respond(h.requests.at(-1),{records:[{...a,version:5},imported]});
  await Promise.all([refresh1.promise,refresh2.promise]);
  assert.ok(h.store.records.some(r=>r.id==='imported'));
});

test('pending is a render snapshot and parallel saves release their own locks',async t=>{
  const a=habitEntry('a'),b=habitEntry('b');
  const h=await mount(t,[a,b]);
  const idle=h.store;
  const saveA=await h.startSave('habitEntry',{...a.data,count:2},a);
  const onlyA=h.store;
  const saveB=await h.startSave('habitEntry',{...b.data,count:2},b);
  assert.equal(h.store.pending('a'),true);
  assert.equal(h.store.pending('b'),true);
  assert.equal(h.store.busy,true);
  assert.equal(idle.pending('a'),false,'a previous render must not see later mutable ref contents');
  assert.equal(onlyA.pending('b'),false,'starting B must not mutate the A-only snapshot');

  const savedA={...a,data:{...a.data,count:2},version:5};
  await h.respond(saveA.request,{record:savedA});
  assert.deepEqual(await saveA.promise,savedA);
  assert.equal(h.store.pending('a'),false);
  assert.equal(h.store.pending('b'),true);
  assert.equal(h.store.busy,true);
  assert.equal(onlyA.pending('a'),true,'completing A must not mutate its pending render snapshot');
  const savedB={...b,data:{...b.data,count:2},version:5};
  await h.respond(saveB.request,{record:savedB});
  await saveB.promise;
  assert.equal(h.store.pending('b'),false);
  assert.equal(h.store.busy,false);
  assert.deepEqual(h.store.records.find(record=>record.id==='a'),savedA);
  assert.deepEqual(h.store.records.find(record=>record.id==='b'),savedB);
});

test('a tap during an in-flight save for the same record queues instead of being dropped',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  const first=await h.startSave('habitEntry',{...a.data,count:2},a);
  assert.equal(h.requests.filter(request=>request.method==='POST').length,1);
  /** @type {Promise<unknown>} */
  let second;
  await act(async()=>{second=h.store.save('habitEntry',{...a.data,count:3,done:true},{...a,data:{...a.data,count:2},version:5});void second.catch(()=>{});});
  assert.equal(h.store.records.find(record=>record.id==='a').data.count,3,'the second tap is reflected instantly, without waiting on the first save');
  assert.equal(h.requests.filter(request=>request.method==='POST').length,1,'the queued write has not been sent yet');
  await h.respond(first.request,{record:{...a,data:{...a.data,count:2},version:5}});
  await first.promise;
  assert.equal(h.requests.filter(request=>request.method==='POST').length,2,'the queued write is sent once the first settles');
  const secondRequest=h.requests.filter(request=>request.method==='POST').at(-1);
  assert.equal(secondRequest.body.version,5,'the queued write carries the version the first save produced');
  await h.respond(secondRequest,{record:{...a,data:{...a.data,count:3,done:true},version:6}});
  await second;
  assert.equal(h.store.records.find(record=>record.id==='a').data.count,3);
  assert.equal(h.store.pending('a'),false);
});

// Each tap below goes through its own act() boundary, the way three separate
// physical clicks each arrive as their own event/render cycle in the real
// app - only the network write is what queues, never the optimistic apply.
test('three rapid taps on a target-3 habit end at 3/3 with three sequential writes',async t=>{
  const h=await mount(t,[]);
  const base={habitId:'habit:x',date:'2026-09-18'};
  const posts=()=>h.requests.filter(r=>r.method==='POST');
  const record=(version,count,done)=>({id:'entry:x',kind:'habitEntry',data:{...base,count,done},version,createdAt:'2026-09-18T10:00:00.000Z',updatedAt:'2026-09-18T10:00:00.000Z',deletedAt:null});

  const tap1=await h.startSave('habitEntry',{...base,count:1,done:false},undefined,'entry:x');
  let current=h.store.records.find(r=>r.id==='entry:x');
  assert.equal(current.data.count,1,'the first tap is reflected instantly');

  const tap2=await h.startSave('habitEntry',{...base,count:2,done:false},current);
  current=h.store.records.find(r=>r.id==='entry:x');
  assert.equal(current.data.count,2,'the second tap is reflected instantly, without waiting on the first save');
  assert.equal(posts().length,1,'the second tap is queued, not sent yet');

  const tap3=await h.startSave('habitEntry',{...base,count:3,done:true},current);
  assert.equal(h.store.records.find(r=>r.id==='entry:x').data.count,3,'the third tap is reflected instantly too');
  assert.equal(posts().length,1,'the third tap is also queued behind the first');

  await h.respond(posts()[0],{record:record(1,1,false)});
  await tap1.promise;
  assert.equal(posts().length,2,'the second tap is sent once the first settles');
  await h.respond(posts()[1],{record:record(2,2,false)});
  await tap2.promise;
  assert.equal(posts().length,3,'the third tap is sent once the second settles');
  await h.respond(posts()[2],{record:record(3,3,true)});
  await tap3.promise;

  assert.equal(posts().length,3,'three taps produced exactly three writes, none dropped');
  const settled=h.store.records.find(r=>r.id==='entry:x');
  assert.equal(settled.data.count,3);
  assert.equal(settled.data.done,true);
  assert.equal(settled.version,3);
  assert.equal(h.store.pending('entry:x'),false);
});

test('when the last of a burst of taps fails, the local count rolls back to the value before that tap',async t=>{
  const h=await mount(t,[]);
  const base={habitId:'habit:x',date:'2026-09-18'};
  const posts=()=>h.requests.filter(r=>r.method==='POST');
  const record=(version,count,done)=>({id:'entry:x',kind:'habitEntry',data:{...base,count,done},version,createdAt:'2026-09-18T10:00:00.000Z',updatedAt:'2026-09-18T10:00:00.000Z',deletedAt:null});

  const tap1=await h.startSave('habitEntry',{...base,count:1,done:false},undefined,'entry:x');
  let current=h.store.records.find(r=>r.id==='entry:x');
  const tap2=await h.startSave('habitEntry',{...base,count:2,done:false},current);
  current=h.store.records.find(r=>r.id==='entry:x');
  const tap3=await h.startSave('habitEntry',{...base,count:3,done:true},current);

  await h.respond(posts()[0],{record:record(1,1,false)});
  await tap1.promise;
  await h.respond(posts()[1],{record:record(2,2,false)});
  await tap2.promise;
  await h.respond(posts()[2],{error:'השמירה לא הצליחה'},503);
  await assert.rejects(tap3.promise,/השמירה לא הצליחה/);

  const settled=h.store.records.find(r=>r.id==='entry:x');
  assert.equal(settled.data.count,2,'rolls back to the count after the last successful tap, not to zero');
  assert.equal(settled.data.done,false);
  assert.equal(h.store.error,'השמירה לא הצליחה');
  assert.equal(h.store.pending('entry:x'),false);
});

test('a burst of taps on one habit never blocks or delays a tap on a different habit',async t=>{
  const vitamins=habitEntry('vitamins',0),water=habitEntry('water',0);
  const h=await mount(t,[vitamins,water]);
  const v1=await h.startSave('habitEntry',{...vitamins.data,count:1},vitamins);
  const w1=await h.startSave('habitEntry',{...water.data,count:1},water);
  const v2=await h.startSave('habitEntry',{...vitamins.data,count:2},h.store.records.find(r=>r.id==='vitamins'));
  assert.equal(h.requests.filter(r=>r.method==='POST'&&r.body.id==='water').length,1,'water was never made to wait on the vitamins queue');
  assert.equal(h.store.records.find(r=>r.id==='water').data.count,1);
  assert.equal(h.store.records.find(r=>r.id==='vitamins').data.count,2,'the second vitamins tap is reflected instantly');
  await h.respond(w1.request,{record:{...water,data:{...water.data,count:1},version:5}});
  await w1.promise;
  const vitaminsPosts=()=>h.requests.filter(r=>r.method==='POST'&&r.body.id==='vitamins');
  await h.respond(vitaminsPosts()[0],{record:{...vitamins,data:{...vitamins.data,count:1},version:5}});
  await v1.promise;
  await h.respond(vitaminsPosts()[1],{record:{...vitamins,data:{...vitamins.data,count:2},version:6}});
  await v2.promise;
  assert.equal(h.store.records.find(r=>r.id==='vitamins').data.count,2);
  assert.equal(h.store.pending('vitamins'),false);
  assert.equal(h.store.pending('water'),false);
});

test('failed update restores the full existing record while another save succeeds',async t=>{
  const original=transaction('expense'),other=habitEntry('b');
  const h=await mount(t,[original,other]);
  const failed=await h.startSave('transaction',{...original.data,amount:9900,funder:'me'},original,undefined,true);
  const successful=await h.startSave('habitEntry',{...other.data,count:2},other);
  assert.ok(h.store.records.find(record=>record.id===original.id).deletedAt);
  const savedOther={...other,data:{...other.data,count:2},version:5};
  await h.respond(successful.request,{record:savedOther});
  await successful.promise;
  await h.respond(failed.request,{error:'save failed'},503);
  await assert.rejects(failed.promise,/save failed/);
  assert.deepEqual(h.store.records.find(record=>record.id===original.id),original);
  assert.deepEqual(h.store.records.find(record=>record.id===other.id),savedOther);
  assert.equal(h.store.error,'save failed');
  assert.equal(h.store.busy,false);
  assert.equal(h.store.pending(original.id),false);
});

test('failed creation removes only its optimistic record and releases its lock',async t=>{
  const original=transaction('expense');
  const h=await mount(t,[original]);
  const fresh=habitEntry('new',2);
  const save=await h.startSave('habitEntry',fresh.data,undefined,fresh.id);
  assert.equal(h.store.records.find(record=>record.id===fresh.id).data.count,2);
  await h.respond(save.request,{error:'creation failed'},409);
  await assert.rejects(save.promise,/creation failed/);
  assert.deepEqual(h.store.records,[original]);
  assert.equal(h.store.pending(fresh.id),false);
  assert.equal(h.store.busy,false);
  const retry=await h.startSave('habitEntry',fresh.data,undefined,fresh.id);
  await h.respond(retry.request,{record:{...fresh,version:1}});
  await retry.promise;
  assert.equal(h.store.records.find(record=>record.id===fresh.id).version,1);
});

test('a pre-save GET cannot overwrite an optimistic update while its save is pending',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  const refresh=await h.startRefresh();
  const save=await h.startSave('habitEntry',{...a.data,count:2},a);
  await h.respond(refresh.request,{records:[a]});
  await refresh.promise;
  assert.equal(h.store.records.find(record=>record.id==='a').data.count,2);
  assert.equal(h.store.pending('a'),true);
  await h.respond(save.request,{record:{...a,data:{...a.data,count:2},version:5}});
  await save.promise;
});

test('a pre-save GET cannot overwrite a completed save or its server version',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  const refresh=await h.startRefresh();
  const save=await h.startSave('habitEntry',{...a.data,count:2},a);
  const saved={...a,data:{...a.data,count:2},version:5,updatedAt:'2026-09-18T12:00:00.000Z'};
  await h.respond(save.request,{record:saved});
  await save.promise;
  await h.respond(refresh.request,{records:[a]});
  await refresh.promise;
  assert.deepEqual(h.store.records,[saved]);
  assert.equal(h.store.busy,false);
});

test('a save overtaking the initial GET completes loading after invalidating that request',async t=>{
  const h=await mount(t,[],{load:false});
  const fresh=habitEntry('new',2);
  const save=await h.startSave('habitEntry',fresh.data,undefined,fresh.id);
  await h.respond(h.requests[0],{records:[]});
  assert.equal(h.store.loading,true,'the invalidated initial load does not finish a newer operation');
  assert.equal(h.store.records.find(record=>record.id===fresh.id).data.count,2);
  await h.respond(save.request,{record:{...fresh,version:1}});
  await save.promise;
  assert.equal(h.store.loading,false,'saving must release loading when it invalidated the initial GET');
  assert.equal(h.store.pending(fresh.id),false);
});

test('a pre-save GET failure cannot surface an obsolete error after saving',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  const refresh=await h.startRefresh();
  const save=await h.startSave('habitEntry',{...a.data,count:2},a);
  const saved={...a,data:{...a.data,count:2},version:5};
  await h.respond(save.request,{record:saved});
  await save.promise;
  await h.respond(refresh.request,{error:'obsolete refresh failure'},503);
  await refresh.promise;
  assert.equal(h.store.error,'');
  assert.deepEqual(h.store.records,[saved]);
});

test('the newest refresh owns records and errors when older requests finish later',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  const staleSuccess=await h.startRefresh();
  const staleFailure=await h.startRefresh();
  const newest=await h.startRefresh();
  const fresh={...a,data:{...a.data,count:3,done:true},version:7};
  await h.respond(newest.request,{records:[fresh]});
  await newest.promise;
  await h.respond(staleSuccess.request,{records:[a]});
  await staleSuccess.promise;
  await h.respond(staleFailure.request,{error:'obsolete failure'},503);
  await staleFailure.promise;
  assert.deepEqual(h.store.records,[fresh]);
  assert.equal(h.store.error,'');
  assert.equal(h.store.loading,false);
});

test('unauthorized save signals the auth gate, rolls back, and releases pending',async t=>{
  const a=habitEntry('a');
  const h=await mount(t,[a]);
  let unauthorized=0;
  window.addEventListener('life:unauthorized',()=>{unauthorized++;});
  const save=await h.startSave('habitEntry',{...a.data,count:2},a);
  await h.respond(save.request,{error:'sign in again'},401);
  await assert.rejects(save.promise,/sign in again/);
  assert.equal(unauthorized,1);
  assert.deepEqual(h.store.records,[a]);
  assert.equal(h.store.pending('a'),false);
  assert.equal(h.store.busy,false);
});
