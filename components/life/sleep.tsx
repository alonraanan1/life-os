'use client';
import {useState,type CSSProperties} from 'react';import {Pencil,Plus,Trash2} from 'lucide-react';import {dateOffset,todayKey,type Entry} from '@/lib/life-model';import {select,useLife} from './use-life';import {Editor,Field,Empty,field} from './editor';import {SleepChart} from './sleep-chart';
// Only "last night" is unambiguous in words — a record dated yesterday is the
// night before that, which "אתמול" would describe wrongly, so it gets a date.
export function nightLabel(date:string,today:string){if(date===today)return 'הלילה האחרון';return new Date(date+'T12:00:00Z').toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'});}
export function SleepView({compact=false}:{compact?:boolean}){
  const {records,save,busy}=useLife();const today=todayKey();
  const [editing,setEditing]=useState<Entry<'sleep'>|null|undefined>();
  const nights=select(records,'sleep').sort((a,b)=>b.data.date.localeCompare(a.data.date));
  const shown=compact?nights.slice(0,1):nights.slice(0,60);
  const recent=nights.slice(0,7).filter(n=>n.data.score>0);
  const average=recent.length?Math.round(recent.reduce((sum,n)=>sum+n.data.score,0)/recent.length):0;
  return <section><header className="module-header"><div><h2>{compact?'השינה שלי':'איך אתה ישן'}</h2><p>{average?'ממוצע '+average+' בשבעת הלילות האחרונים':'ציון השינה מהשעון, לילה אחר לילה'}</p></div><button className="quiet-action" onClick={()=>setEditing(null)}><Plus size={17}/>לילה חדש</button></header>
  {!compact&&<SleepChart nights={nights}/>}
  {shown.map(night=>{const pct=Math.min(100,night.data.score);return <article className="sleep-record" key={night.id}><div className="record-row">
    <div className="ring" role="progressbar" aria-label={'ציון שינה '+night.data.date} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{'--pct':pct} as CSSProperties}><div className="hole"><span className="num">{night.data.score||'—'}</span></div></div>
    <div className="record-body"><p>{nightLabel(night.data.date,today)}</p><small>{night.data.hours?night.data.hours+' שעות שינה':'ללא שעות'}{night.data.note?' · '+night.data.note:''}</small></div>
    <button className="icon-action" aria-label={'עריכת '+night.data.date} onClick={()=>setEditing(night)}><Pencil size={17}/></button>
    {!compact&&<button className="icon-action" disabled={busy} aria-label={'מחיקת '+night.data.date} onClick={()=>{void save('sleep',night.data,night,undefined,true).catch(()=>{});}}><Trash2 size={17}/></button>}
  </div></article>;})}
  {!shown.length&&<Empty title={compact?'עוד לא תועד לילה':'איך ישנת אתמול?'} text="הציון מגיע מהשעון, ואפשר להוסיף גם כמה שעות ישנת." action="הוספת לילה" onAction={()=>setEditing(null)}/>}
  {editing!==undefined&&<Editor title={editing?'עדכון לילה':'לילה חדש'} onClose={()=>setEditing(undefined)} onSave={f=>{const date=field(f,'date'),id='sleep:'+date;const existing=records.find(r=>r.id===id) as Entry<'sleep'>|undefined;return save('sleep',{date,score:Number(field(f,'score')||0),hours:Number(field(f,'hours')||0),note:field(f,'note')},existing,id);}}>
    <Field label="תאריך"><input name="date" type="date" required max={today} readOnly={!!editing} defaultValue={editing?.data.date||today}/></Field>
    <div className="form-columns"><Field label="ציון שינה (0-100)"><input name="score" type="number" min="0" max="100" step="1" defaultValue={editing?.data.score||''}/></Field><Field label="שעות שינה"><input name="hours" type="number" min="0" max="24" step="0.1" defaultValue={editing?.data.hours||''}/></Field></div>
    <Field label="הערה (רשות)"><textarea name="note" rows={3} maxLength={3000} defaultValue={editing?.data.note}/></Field>
    <p className="field-help">מספיק אחד מהשניים — ציון או שעות. לכל לילה נשמרת רשומה אחת.</p>
  </Editor>}</section>;
}
