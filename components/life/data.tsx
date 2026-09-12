'use client';
import {useRef,useState} from 'react';import {Download,LogOut,Pencil,RotateCcw,Upload} from 'lucide-react';import {kinds,type Entry,type Kind} from '@/lib/life-model';import {select,useLife} from './use-life';import {Editor,Field,Empty,field} from './editor';
const labels:Record<Kind,string>={task:'משימות',habit:'הרגלים',habitEntry:'סימוני הרגלים',transaction:'תנועות כספיות',budget:'תקציבים',goal:'מטרות',checkin:'צ׳ק־אינים',sleep:'לילות שינה',settings:'הגדרות'};
const single:Record<Kind,string>={task:'משימה',habit:'הרגל',habitEntry:'סימון הרגל',transaction:'תנועה',budget:'תקציב',goal:'מטרה',checkin:'צ׳ק־אין',sleep:'שינה',settings:'הגדרות'};
function titleOf(entry:Entry){const data=entry.data as Record<string,unknown>;for(const key of ['title','note','name','month','date']){const value=data[key];if(typeof value==='string'&&value.trim())return value;}return entry.id;}
export function DataView(){
  const {records,save,busy,refresh}=useLife();const file=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState(''),[problem,setProblem]=useState(''),[working,setWorking]=useState(false),[editingName,setEditingName]=useState(false);
  const settings=records.find(r=>r.id==='settings'&&!r.deletedAt) as Entry<'settings'>|undefined;
  const trash=records.filter(r=>r.deletedAt).sort((a,b)=>String(b.deletedAt).localeCompare(String(a.deletedAt)));
  const counts=kinds.map(kind=>[kind,select(records,kind).length] as const).filter(([,total])=>total>0);
  const restore=(entry:Entry)=>(save as unknown as (kind:Kind,data:unknown,existing:Entry,id?:string,deleted?:boolean)=>Promise<unknown>)(entry.kind,entry.data,entry,undefined,false);
  async function importBackup(chosen:File){
    setMessage('');setProblem('');
    if(chosen.size>2000000){setProblem('קובץ הגיבוי גדול מ־2MB. אפשר לייבא אותו בחלקים.');return;}
    setWorking(true);
    try{const body=await chosen.text();const response=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body});const result=await response.json() as {imported?:number;error?:string};if(!response.ok)throw new Error(result.error||'הייבוא לא הצליח');await refresh();setMessage(result.imported?'שוחזרו '+result.imported+' רשומות.':'כל הרשומות בקובץ כבר קיימות אצלך.');}
    catch(error){setProblem(error instanceof Error?error.message:'הייבוא לא הצליח.');}
    finally{setWorking(false);if(file.current)file.current.value='';}
  }
  async function logout(){setWorking(true);try{await fetch('/api/auth',{method:'DELETE'});}catch{}window.location.reload();}
  return <div className="content-flow">
    <section><header className="module-header"><div><h2>הפרופיל שלי</h2><p>השם שמופיע בברכה בראש המסך</p></div><button className="quiet-action" onClick={()=>setEditingName(true)}><Pencil size={17}/>שינוי שם</button></header><p className="data-note">{settings?.data.name?'שלום, '+settings.data.name+'.':'עוד לא בחרת שם להצגה.'}</p></section>
    <section><header className="module-header"><div><h2>גיבוי ושחזור</h2><p>הנתונים שלך שמורים אצלך, וניתן לקחת אותם איתך</p></div></header>
      <div className="data-actions">
        <a className="primary-action" href="/api/export" download="life-os-backup.json"><Download size={17}/>הורדת גיבוי</a>
        <button className="quiet-action" disabled={working} onClick={()=>file.current?.click()}><Upload size={17}/>{working?'מייבא…':'שחזור מקובץ'}</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={event=>{const chosen=event.target.files?.[0];if(chosen)void importBackup(chosen);}}/>
      </div>
      <p className="field-help">הגיבוי הוא קובץ JSON אחד עם כל הרשומות. שחזור מוסיף רשומות חסרות בלבד ולעולם אינו דורס מה שקיים.</p>
      {message&&<output className="data-ok">{message}</output>}{problem&&<p role="alert" className="form-error">{problem}</p>}
      {!!counts.length&&<div className="data-counts">{counts.map(([kind,total])=><div key={kind}><strong>{total}</strong><span>{labels[kind]}</span></div>)}</div>}
    </section>
    <section><header className="module-header"><div><h2>סל המיחזור</h2><p>{trash.length?trash.length+' פריטים שנמחקו וניתן להחזיר':'אין פריטים שנמחקו'}</p></div></header>
      {trash.slice(0,60).map(entry=><div className="record-row" key={entry.id}><div className="record-body"><p>{titleOf(entry)}</p><small>{single[entry.kind]} · נמחק ב־{String(entry.deletedAt).slice(0,10)}</small></div><button className="quiet-action" disabled={busy} aria-label={'שחזור '+titleOf(entry)} onClick={()=>{void restore(entry).catch(()=>{});}}><RotateCcw size={16}/>שחזור</button></div>)}
      {!trash.length&&<Empty title="שום דבר לא אבד" text="פריטים שתמחק יחכו כאן עד שתחליט להחזיר אותם."/>}
    </section>
    <section><header className="module-header"><div><h2>יציאה מהחשבון</h2><p>תמיד אפשר להתחבר חזרה עם הסיסמה שלך</p></div></header><button className="quiet-action" disabled={working} onClick={()=>{void logout();}}><LogOut size={17}/>התנתקות</button></section>
    {editingName&&<Editor title="השם שלי" onClose={()=>setEditingName(false)} onSave={form=>save('settings',{name:field(form,'name')},settings,'settings')}><Field label="איך לפנות אליך?"><input name="name" required maxLength={60} defaultValue={settings?.data.name||''}/></Field></Editor>}
  </div>;
}
