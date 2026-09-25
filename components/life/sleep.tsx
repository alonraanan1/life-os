'use client';
import {useState} from 'react';import {ChevronDown,Plus} from 'lucide-react';import {formatSleepDuration,sleepHoursFromParts,sleepParts,todayKey,type Entry} from '@/lib/life-model';import {select,useLife} from './use-life';import {Editor,Field,Empty,field} from './editor';import {SleepChart} from './sleep-chart';
// Only "last night" is unambiguous in words — a record dated yesterday is the
// night before that, which "אתמול" would describe wrongly, so it gets a date.
export function nightLabel(date:string,today:string){if(date===today)return 'הלילה האחרון';return new Date(date+'T12:00:00Z').toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'});}
export function SleepView({compact=false,title}:{compact?:boolean;title?:string}){
  const {records,save}=useLife();const today=todayKey();
  const [editing,setEditing]=useState<Entry<'sleep'>|null|undefined>();
  const nights=select(records,'sleep').sort((a,b)=>b.data.date.localeCompare(a.data.date));
  // The newest night stays in view; older nights wait behind a native
  // disclosure, since the chart above already carries the recent trend.
  const older=compact?[]:nights.slice(1,60);
  const recent=nights.slice(0,7).filter(n=>n.data.score>0);
  const average=recent.length?Math.round(recent.reduce((sum,n)=>sum+n.data.score,0)/recent.length):0;
  // The whole row opens the editor; delete lives there, as it does for habits.
  // The spoken name is short and says what the tap does; a long note stays
  // visible text only, so it is not read out on every focus.
  const row=(night:Entry<'sleep'>)=>{const label=nightLabel(night.data.date,today),hours=night.data.hours?formatSleepDuration(night.data.hours)+' שעות שינה':'ללא שעות';
    return <button type="button" className="record-row sleep-row" key={night.id} aria-label={'עריכת '+label+': '+hours+', ציון '+(night.data.score||'ללא')} onClick={()=>setEditing(night)}>
    <span className="record-body"><span>{label}</span><small>{hours}{night.data.note?' · '+night.data.note:''}</small></span>
    <span className="num sleep-score">{night.data.score||'—'}</span>
  </button>;};
  return <section className="sleep-view"><header className="module-header"><div><h2>{title|| (compact?'השינה שלי':'איך אתה ישן')}</h2><p>{average?'ממוצע '+average+' בשבעת הלילות האחרונים':'שעות שינה, דירוג והיסטוריית לילות.'}</p></div><button className="quiet-action" onClick={()=>setEditing(null)}><Plus size={17}/>לילה חדש</button></header>
  {!compact&&<SleepChart nights={nights}/>}
  {nights[0]&&row(nights[0])}
  {!!older.length&&<details className="sleep-history"><summary className="quiet-action">כל הלילות<ChevronDown size={16} aria-hidden="true"/></summary>{older.map(night=>row(night))}</details>}
  {!nights.length&&<Empty title={compact?'עוד לא תועד לילה':'איך ישנת אתמול?'} text="הציון מגיע מהשעון, ואפשר להוסיף גם כמה שעות ישנת." action="הוספת לילה" onAction={()=>setEditing(null)}/>}
  {editing!==undefined&&<Editor title={editing?'עדכון לילה':'לילה חדש'} onClose={()=>setEditing(undefined)} onSave={f=>{const date=field(f,'date'),id='sleep:'+date;const existing=records.find(r=>r.id===id) as Entry<'sleep'>|undefined;return save('sleep',{date,score:Number(field(f,'score')||0),hours:sleepHoursFromParts(Number(field(f,'hours')||0),Number(field(f,'minutes')||0)),note:field(f,'note')},existing,id);}} onDelete={editing?()=>{const fresh=(records.find(r=>r.id===editing.id) as Entry<'sleep'>|undefined)??editing;void save('sleep',fresh.data,fresh,undefined,true).catch(()=>{});setEditing(undefined);}:undefined}>
    <Field label="תאריך"><input name="date" type="date" required max={today} readOnly={!!editing} defaultValue={editing?.data.date||today}/></Field>
    <div className="form-columns"><Field label="ציון שינה (0-100)"><input name="score" type="number" min="0" max="100" step="1" defaultValue={editing?.data.score||''}/></Field><Field label="שעות שינה"><input name="hours" type="number" inputMode="numeric" min="0" max="24" step="1" defaultValue={editing?.data.hours?sleepParts(editing.data.hours).hours:''}/></Field><Field label="דקות שינה (0-59)"><input name="minutes" type="number" inputMode="numeric" min="0" max="59" step="1" defaultValue={editing?.data.hours?sleepParts(editing.data.hours).minutes:''}/></Field></div>
    <Field label="הערה (רשות)"><textarea name="note" rows={3} maxLength={3000} defaultValue={editing?.data.note}/></Field>
    <p className="field-help">מספיק אחד מהשניים — ציון או שעות. לכל לילה נשמרת רשומה אחת.</p>
  </Editor>}</section>;
}
