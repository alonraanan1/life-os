'use client';

import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Check,ChevronLeft,ChevronRight,Flame,Pencil,Plus,Trash2} from 'lucide-react';
import {calendarWeek,dateOffset,scheduled,streak,todayKey,type Entry} from '@/lib/life-model';
import {select,useLife} from './use-life';
import {Editor,Empty,Field,field} from './editor';
import {SleepView} from './sleep';

const days=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
type HabitFilter='scheduled'|'all';

function readableDate(date:string){
  return new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'numeric',month:'long'}).format(new Date(date+'T12:00:00Z'));
}

export function HabitsView({compact=false}:{compact?:boolean}){
  const {records,save,busy}=useLife();
  const [today,setToday]=useState(todayKey());
  const todayRef=useRef(today);
  const [date,setDate]=useState(todayKey());
  const [filter,setFilter]=useState<HabitFilter>('scheduled');
  const [editing,setEditing]=useState<Entry<'habit'>|null|undefined>();
  const habits=select(records,'habit');
  const entries=select(records,'habitEntry');

  // Keep an open page on the current Israel date after midnight, while leaving
  // an explicitly selected historical date alone.
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      const next=todayKey();
      const current=todayRef.current;
      if(current===next)return;
      todayRef.current=next;
      setToday(next);
      setDate(selected=>selected===current?next:selected);
    },60000);
    return()=>window.clearInterval(timer);
  },[]);

  const selected=date>today?today:date;
  const dueHabits=habits.filter(h=>scheduled(h.data,selected));
  const visible=compact?dueHabits:filter==='scheduled'?dueHabits:habits;
  const week=calendarWeek(selected);
  const completed=dueHabits.filter(h=>entries.some(e=>e.data.habitId===h.id&&e.data.date===selected&&e.data.done)).length;
  const completionPercent=dueHabits.length?Math.round(completed/dueHabits.length*100):0;
  const habitCountLabel=habits.length===1?'הרגל פעיל':habits.length+' הרגלים פעילים';

  function moveDate(offset:number){
    const next=dateOffset(selected,offset);
    if(next<=today)setDate(next);
  }

  async function toggle(h:Entry<'habit'>,day:string){
    const id='entry:'+h.id+':'+day;
    const old=records.find(e=>e.id===id) as Entry<'habitEntry'>|undefined;
    await save('habitEntry',{habitId:h.id,date:day,done:!(old&&!old.deletedAt&&old.data.done)},old,id);
  }

  return <>
  <section className="habits-view">
    <header className="module-header">
      <div>
        <h2>{compact?'הרגלים של היום':'ההרגלים שלי'}</h2>
        <p>{compact?'כל סימון הוא צעד קטן קדימה.':habits.length?habitCountLabel:'התחלה קטנה, שגרה שאפשר לראות.'}</p>
      </div>
      <button className="quiet-action" onClick={()=>setEditing(null)}><Plus size={17}/>הרגל חדש</button>
    </header>

    {!compact&&<div className="habit-toolbar">
      <div className="date-control habit-date-control">
        <button className="icon-action" aria-label="היום הקודם" onClick={()=>moveDate(-1)}><ChevronRight size={17}/></button>
        <label className="sr-only" htmlFor="habit-date">יום לתיעוד</label>
        <input id="habit-date" aria-label="יום לתיעוד" type="date" value={selected} max={today} onChange={event=>{const next=event.target.value;if(next&&next<=today)setDate(next);}}/>
        <button className="icon-action" aria-label="היום הבא" onClick={()=>moveDate(1)} disabled={selected>=today}><ChevronLeft size={17}/></button>
        {selected!==today&&<button className="quiet-action today-jump" onClick={()=>setDate(today)}>חזרה להיום</button>}
      </div>
      <div className="filter-row" aria-label="סינון הרגלים">
        <button className={filter==='scheduled'?'selected':''} aria-pressed={filter==='scheduled'} onClick={()=>setFilter('scheduled')}>מתוכננים ליום</button>
        <button className={filter==='all'?'selected':''} aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>כל ההרגלים</button>
      </div>
    </div>}

    <div className="habit-summary" aria-label="סיכום ביצועי הרגלים">
      <div className="habit-summary-copy">
        <span>{selected===today?'היום':readableDate(selected)}</span>
        <strong>{dueHabits.length?completed+'/'+dueHabits.length:'—'}</strong>
        <small>{dueHabits.length?(completed===dueHabits.length?'כל ההרגלים הושלמו':'הושלמו'):habits.length?'יום מנוחה מתוכנן':'עוד לא הוספת הרגלים'}</small>
      </div>
      <div className="habit-progress" role="progressbar" aria-label="השלמת ההרגלים המתוכננים" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
        <span style={{'--pct':completionPercent/100} as CSSProperties}/>
      </div>
    </div>

    <div className="habit-list">
      {visible.map(h=>{
        const done=entries.some(e=>e.data.habitId===h.id&&e.data.date===selected&&e.data.done);
        const due=scheduled(h.data,selected);
        const streakDays=streak(h,entries,selected);
        const scheduleLabel=h.data.days.length===7?'כל יום':h.data.days.map(day=>days[day]).join(' · ');
        return <div key={h.id} className="habit-record">
          <div className="record-row">
            <span className="habit-emoji" aria-hidden="true">{h.data.emoji}</span>
            <div className="record-body">
              <p>{h.data.title}</p>
              <small><Flame size={13} className="inline"/> {streakDays===1?'יום ביצוע ברצף':streakDays+' ימי ביצוע ברצף'}</small>
              <small className="habit-schedule">{scheduleLabel}</small>
            </div>
            <div className="habit-actions">
              <button aria-label={(done?'ביטול סימון ':'סימון ')+h.data.title} aria-pressed={done} disabled={busy||!due} className={'habit-mark '+(done?'checked':'')} onClick={()=>{void toggle(h,selected).catch(()=>{});}}>{done?<Check size={17}/>:due?'סימון':'יום מנוחה'}</button>
              <button className="icon-action" aria-label={'עריכת '+h.data.title} onClick={()=>setEditing(h)}><Pencil size={16}/></button>
              {!compact&&<button className="icon-action" disabled={busy} aria-label={'מחיקת '+h.data.title} onClick={()=>{void save('habit',h.data,h,undefined,true).catch(()=>{});}}><Trash2 size={16}/></button>}
            </div>
          </div>
          {!compact&&<div className="habit-history" aria-label={'שבוע קלנדרי: '+h.data.title}>
            {week.map(day=>{
              const marked=entries.some(e=>e.data.habitId===h.id&&e.data.date===day&&e.data.done);
              const canMark=day<=today&&scheduled(h.data,day);
              return <button key={day} className={marked?'marked':''} aria-label={h.data.title+' '+day+(marked?' בוצע':day>today?' טרם הגיע':' לא בוצע')} aria-current={day===today?'date':undefined} aria-pressed={marked} disabled={busy||!canMark} onClick={()=>{void toggle(h,day).catch(()=>{});}}>
                <span>{new Date(day+'T12:00:00Z').toLocaleDateString('he-IL',{weekday:'short'})}</span>
                <b>{marked?<Check size={16}/>:new Date(day+'T12:00:00Z').getUTCDate()}</b>
              </button>;
            })}
          </div>}
        </div>;
      })}
    </div>

    {!visible.length&&<Empty title={habits.length?'יום מנוחה מתוכנן':'הרגל קטן, התחלה טובה'} text={habits.length?'אין הרגלים מתוכננים ליום הזה. אפשר לבחור "כל ההרגלים" כדי לערוך את לוח הזמנים.':'בחר משהו שתרצה לעשות באופן קבוע.'} action="הוספת הרגל" onAction={()=>setEditing(null)}/>}

    {editing!==undefined&&<Editor title={editing?'עריכת הרגל':'הרגל חדש'} onClose={()=>setEditing(undefined)} onSave={form=>save('habit',{title:field(form,'title'),emoji:field(form,'emoji'),startDate:field(form,'startDate'),days:form.getAll('days').map(Number)},editing||undefined)}>
      <Field label="שם ההרגל"><input name="title" required maxLength={200} defaultValue={editing?.data.title}/></Field>
      <div className="form-columns"><Field label="סמל"><select name="emoji" defaultValue={editing?.data.emoji||'🌱'}>{['🌱','💧','📚','🚶','🧘','🏃','💪','🛌'].map(emoji=><option key={emoji}>{emoji}</option>)}</select></Field><Field label="תאריך התחלה"><input name="startDate" type="date" required max={today} defaultValue={editing?.data.startDate||today}/></Field></div>
      <fieldset className="day-picker"><legend>באילו ימים?</legend>{days.map((day,index)=><label key={index}><input type="checkbox" name="days" value={index} defaultChecked={editing?editing.data.days.includes(index):true}/><span>{day}</span></label>)}</fieldset>
    </Editor>}
  </section>
  {!compact&&<SleepView title="הרגל השינה"/>}
  </>;
}
