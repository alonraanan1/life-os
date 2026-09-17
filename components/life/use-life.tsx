'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {Entry,Kind,DataMap} from '@/lib/life-model';
type Store={records:Entry[];loading:boolean;busy:boolean;pending:(id:string)=>boolean;error:string;clearError:()=>void;refresh:()=>Promise<void>;save:<K extends Kind>(kind:K,data:DataMap[K],existing?:Entry<K>,id?:string,deleted?:boolean)=>Promise<Entry<K>>};
const Context=createContext<Store|null>(null);
export function LifeProvider({children}:{children:ReactNode}){const [records,setRecords]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');const requestId=useRef(0),saving=useRef<Set<string>>(new Set());
const refresh=useCallback(async()=>{if(saving.current.size)return;const id=++requestId.current;try{const r=await fetch('/api/records',{cache:'no-store'});if(r.status===401){window.dispatchEvent(new Event('life:unauthorized'));return;}const d=await r.json() as {records:Entry[];error:string};if(!r.ok)throw new Error(d.error);if(id===requestId.current){setRecords(d.records);setError('');}}catch(e){setError(e instanceof Error?e.message:'לא ניתן לטעון נתונים');}finally{setLoading(false);}},[]);
useEffect(()=>{void refresh();const focus=()=>{if(document.visibilityState==='visible')void refresh();};document.addEventListener('visibilitychange',focus);window.addEventListener('focus',focus);return()=>{document.removeEventListener('visibilitychange',focus);window.removeEventListener('focus',focus);};},[refresh]);
// Per-record lock: two saves to the *same* record can't race, but marking
// habit B never waits on habit A's save landing.
const save=useCallback(async<K extends Kind,>(kind:K,data:DataMap[K],existing?:Entry<K>,id?:string,deleted=false):Promise<Entry<K>>=>{const recordId=existing?.id||id||crypto.randomUUID();if(saving.current.has(recordId))throw new Error('שמירה מתבצעת. נסה שוב בעוד רגע.');saving.current.add(recordId);setBusy(true);setError('');
// Apply the change to local state immediately so the UI reflects the tap
// before the network round-trip resolves, then reconcile (or roll back).
const now=new Date().toISOString(),optimistic={id:recordId,kind,data,version:(existing?.version||0)+1,createdAt:existing?.createdAt||now,updatedAt:now,deletedAt:deleted?now:null} as Entry<K>;
setRecords(items=>[optimistic,...items.filter(x=>x.id!==recordId)]);
try{const r=await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,data,id:recordId,version:existing?.version||0,deleted})});const d=await r.json() as {record:Entry<K>;error:string};if(r.status===401)window.dispatchEvent(new Event('life:unauthorized'));if(!r.ok)throw new Error(d.error);setRecords(items=>[d.record,...items.filter(x=>x.id!==d.record.id)]);return d.record;}catch(e){setRecords(items=>existing?[existing,...items.filter(x=>x.id!==recordId)]:items.filter(x=>x.id!==recordId));setError(e instanceof Error?e.message:'השמירה נכשלה');throw e;}finally{saving.current.delete(recordId);setBusy(saving.current.size>0);}},[]);
return <Context.Provider value={{records,loading,busy,pending:id=>saving.current.has(id),error,clearError:()=>setError(''),refresh,save}}>{children}</Context.Provider>;}
export function useLife(){const s=useContext(Context);if(!s)throw new Error('LifeProvider missing');return s;}
export function select<K extends Kind>(records:Entry[],kind:K,trash=false){return records.filter(x=>x.kind===kind&&(trash?!!x.deletedAt:!x.deletedAt)) as Entry<K>[];}
