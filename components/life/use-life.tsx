'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {Entry,Kind,DataMap} from '@/lib/life-model';
type Store={records:Entry[];loading:boolean;busy:boolean;pending:(id:string)=>boolean;error:string;clearError:()=>void;refresh:()=>Promise<void>;save:<K extends Kind>(kind:K,data:DataMap[K],existing?:Entry<K>,id?:string,deleted?:boolean)=>Promise<Entry<K>>};
const Context=createContext<Store|null>(null);
type SaveBatch={confirmed:Entry|undefined;error?:Error};
export function LifeProvider({children}:{children:ReactNode}){const [records,setRecords]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[pendingIds,setPendingIds]=useState<ReadonlySet<string>>(new Set()),[error,setError]=useState('');const requestId=useRef(0),saving=useRef<Set<string>>(new Set()),queues=useRef<Map<string,Promise<void>>>(new Map()),saveSeq=useRef<Map<string,number>>(new Map());
const batches=useRef(new Map<string,SaveBatch>()),refreshWaiters=useRef<Array<()=>void>>([]);
const refresh=useCallback(async()=>{if(saving.current.size)return new Promise<void>(resolve=>refreshWaiters.current.push(resolve));const id=++requestId.current;try{const r=await fetch('/api/records',{cache:'no-store'});if(r.status===401){window.dispatchEvent(new Event('life:unauthorized'));return;}const d=await r.json() as {records:Entry[];error:string};if(id!==requestId.current)return;if(!r.ok)throw new Error(d.error);setRecords(d.records);setError('');}catch(e){if(id===requestId.current)setError(e instanceof Error?e.message:'לא ניתן לטעון נתונים');}finally{if(id===requestId.current)setLoading(false);}},[]);
// refresh() sets state only after its fetch resolves; the rule cannot see past the await.
// oxlint-disable-next-line react/react-compiler
useEffect(()=>{void refresh();const focus=()=>{if(document.visibilityState==='visible')void refresh();};document.addEventListener('visibilitychange',focus);window.addEventListener('focus',focus);return()=>{document.removeEventListener('visibilitychange',focus);window.removeEventListener('focus',focus);};},[refresh]);
// Per-record queue: a tap that lands while a save for the *same* record is
// still in flight is queued behind it instead of being dropped, so a burst
// of taps (e.g. marking a 3x-target habit three times fast) never loses a
// count. Marking habit B never waits on habit A's queue.
// Every tap still applies its own optimistic state immediately (the UI must
// never wait on the network), but only the *most recent* tap for a record is
// allowed to write its network outcome into state - an older queued save
// settling late can never stomp a newer optimistic count.
// A save also invalidates older GETs so they cannot overwrite newer local data.
const save=useCallback(async<K extends Kind,>(kind:K,data:DataMap[K],existing?:Entry<K>,id?:string,deleted=false):Promise<Entry<K>>=>{const recordId=existing?.id||id||crypto.randomUUID(),seq=(saveSeq.current.get(recordId)||0)+1;saveSeq.current.set(recordId,seq);if(!saving.current.has(recordId)){saving.current.add(recordId);batches.current.set(recordId,{confirmed:existing});setPendingIds(new Set(saving.current));}const batch=batches.current.get(recordId)!;++requestId.current;setError('');
// Apply the change to local state immediately so the UI reflects the tap
// before the network round-trip resolves, then reconcile (or roll back).
const now=new Date().toISOString(),optimistic={id:recordId,kind,data,version:(existing?.version||0)+1,createdAt:existing?.createdAt||now,updatedAt:now,deletedAt:deleted?now:null} as Entry<K>;
setRecords(items=>[optimistic,...items.filter(x=>x.id!==recordId)]);
let outcome!:Entry<K>|Error;
// A failed write invalidates the dependent optimistic versions in this burst.
// Cancel those writes and restore the last server-confirmed record, never an
// optimistic `existing` snapshot. A fresh user retry starts a new batch.
const execute=async()=>{try{if(batch.error)throw batch.error;const r=await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,data,id:recordId,version:batch.confirmed?.version||0,deleted})});const d=await r.json() as {record:Entry<K>;error:string};if(r.status===401)window.dispatchEvent(new Event('life:unauthorized'));if(!r.ok)throw new Error(d.error);batch.confirmed=d.record;outcome=d.record;if(saveSeq.current.get(recordId)===seq)setRecords(items=>[d.record,...items.filter(x=>x.id!==d.record.id)]);}catch(e){const err=e instanceof Error?e:new Error('השמירה נכשלה');batch.error=err;outcome=err;if(saveSeq.current.get(recordId)===seq){const confirmed=batch.confirmed;setRecords(items=>confirmed?[confirmed,...items.filter(x=>x.id!==recordId)]:items.filter(x=>x.id!==recordId));setError(err.message);}}};
const previous=queues.current.get(recordId),run=previous?previous.then(execute):execute();
queues.current.set(recordId,run);
await run;
if(queues.current.get(recordId)===run){queues.current.delete(recordId);batches.current.delete(recordId);saving.current.delete(recordId);setPendingIds(new Set(saving.current));if(!saving.current.size){setLoading(false);const waiters=refreshWaiters.current.splice(0);if(waiters.length)void refresh().finally(()=>waiters.forEach(resolve=>resolve()));}}
// `outcome` is a local of this callback, not a dependency.
// oxlint-disable-next-line react/react-compiler
if(outcome instanceof Error)throw outcome;
return outcome;},[refresh]);
return <Context.Provider value={{records,loading,busy:pendingIds.size>0,pending:id=>pendingIds.has(id),error,clearError:()=>setError(''),refresh,save}}>{children}</Context.Provider>;}
export function useLife(){const s=useContext(Context);if(!s)throw new Error('LifeProvider missing');return s;}
export function select<K extends Kind>(records:Entry[],kind:K,trash=false){return records.filter(x=>x.kind===kind&&(trash?!!x.deletedAt:!x.deletedAt)) as Entry<K>[];}
