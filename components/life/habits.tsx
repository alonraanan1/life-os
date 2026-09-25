'use client';

import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Activity,Bed,BookOpen,Check,ChevronLeft,ChevronRight,Circle,Droplet,Dumbbell,Flame,Footprints,Medal,Pencil,Plus,Sprout,Wind} from 'lucide-react';
import {calendarWeek,dateOffset,entryCount,entryStepsDone,habitTarget,MEDAL_MARKS,MEDAL_STREAKS,perfectStreaks,scheduled,streak,todayKey,weekday,toggleHabitPill,toggleHabitStep,type Entry,type HabitEntryData} from '@/lib/life-model';
import {tap} from '@/lib/haptics';
import {select,useLife} from './use-life';
import {Editor,Empty,Field,field} from './editor';

const days=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
type HabitFilter='scheduled'|'all';
const emojiOptions:[string,string][]=[['🌱','צמיחה'],['💧','שתייה'],['📚','קריאה'],['🚶','הליכה'],['🧘','מדיטציה'],['🏃','ריצה'],['💪','כוח'],['🛌','שינה']];
const emojiIcons:Record<string,typeof Circle>={'🌱':Sprout,'💧':Droplet,'📚':BookOpen,'🚶':Footprints,'🧘':Wind,'🏃':Activity,'💪':Dumbbell,'🛌':Bed};
function habitIcon(emoji:string){return emojiIcons[emoji]||Circle;}

function readableDate(date:string){
  return new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'numeric',month:'long'}).format(new Date(date+'T12:00:00Z'));
}

export function HabitsView({compact=false}:{compact?:boolean}){
  const {records,save}=useLife();
  const [today,setToday]=useState(todayKey());
  const todayRef=useRef(today);
  const [date,setDate]=useState(todayKey());
  const [filter,setFilter]=useState<HabitFilter>('scheduled');
  const [editing,setEditing]=useState<Entry<'habit'>|null|undefined>();
  const [stepsText,setStepsText]=useState('');
  const [cheer,setCheer]=useState(0);
  const [medal,setMedal]=useState('');
  const edit=(h:Entry<'habit'>|null)=>{setEditing(h);setStepsText(h?.data.steps?.join(', ')||'');};
  const stepNames=stepsText.split(',').map(s=>s.trim()).filter(Boolean);
  const stepsLocked=stepNames.length>=2;
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
  const perfect=perfectStreaks(habits,entries,selected);
  const marks=entries.filter(e=>e.data.done).length;
  const habitCountLabel=habits.length===1?'הרגל פעיל':habits.length+' הרגלים פעילים';

  function moveDate(offset:number){
    const next=dateOffset(selected,offset);
    if(next<=today)setDate(next);
  }

  function entryId(habitId:string,day:string){return 'entry:'+habitId+':'+day;}

  // Every mark goes through here. Only the tap that completes today's last due
  // habit celebrates — never a load, refresh, date switch or Shortcut — and a
  // tap that crosses a medal threshold names the medal once, in the summary.
  function mark(h:Entry<'habit'>,day:string,data:HabitEntryData,old?:Entry<'habitEntry'>){
    if(data.done&&!(old&&!old.deletedAt&&old.data.done)){
      const closes=day===today&&selected===today&&completed===dueHabits.length-1,run=perfect.current+1;
      if(closes)setCheer(c=>c+1);
      setMedal(closes&&run>perfect.best&&MEDAL_STREAKS.includes(run)?run+' ימים מושלמים ברצף':MEDAL_MARKS.includes(marks+1)?(marks+1)+' סימונים':'');
    }
    return save('habitEntry',data,old,entryId(h.id,day));
  }

  // A single control for every habit: for a target of 1 this is a plain
  // tap-to-undo toggle (the count mirrors done, 1 or 0); for a target above 1
  // each tap adds one and a completed day wraps back to zero, same gesture.
  async function toggle(h:Entry<'habit'>,day:string){
    if(h.data.steps)return togglePill(h,day);
    const id=entryId(h.id,day);
    const old=records.find(e=>e.id===id) as Entry<'habitEntry'>|undefined;
    const target=habitTarget(h.data);
    const current=old&&!old.deletedAt?entryCount(old.data):0;
    const count=current>=target?0:current+1;
    await mark(h,day,{habitId:h.id,date:day,done:count>=target,count},old);
  }

  // A habit with named steps replaces the counter with one chip per step;
  // this toggles just that index and count/done fall out of it.
  async function toggleStep(h:Entry<'habit'>,day:string,index:number){
    const id=entryId(h.id,day);
    const old=records.find(e=>e.id===id) as Entry<'habitEntry'>|undefined;
    const target=habitTarget(h.data);
    const current=old&&!old.deletedAt?entryStepsDone(old.data):[];
    const {stepsDone,count,done}=toggleHabitStep(current,index,target);
    await mark(h,day,{habitId:h.id,date:day,done,count,stepsDone},old);
  }

  // The mark pill on a stepped habit is the same gesture as a numeric one:
  // mark the next unmarked step, and a complete day clears every step.
  // toggleHabitPill is the one place that decides which index(es) to flip.
  async function togglePill(h:Entry<'habit'>,day:string){
    if(!h.data.steps)return;
    const id=entryId(h.id,day);
    const old=records.find(e=>e.id===id) as Entry<'habitEntry'>|undefined;
    const target=habitTarget(h.data);
    const current=old&&!old.deletedAt?entryStepsDone(old.data):[];
    const {stepsDone,count,done}=toggleHabitPill(current,target);
    await mark(h,day,{habitId:h.id,date:day,done,count,stepsDone},old);
  }

  return <section className="habits-view">
    <header className="module-header">
      <div>
        <h2>{compact?'הרגלים של היום':'ההרגלים שלי'}</h2>
        <p>{compact?'כל סימון הוא צעד קטן קדימה.':habits.length?habitCountLabel:'התחלה קטנה, שגרה שאפשר לראות.'}</p>
      </div>
      <button className="quiet-action" onClick={()=>edit(null)}><Plus size={17}/>הרגל חדש</button>
    </header>

    {/* Before the first habit there is no day to move through or sum up;
        the empty state below is the whole screen. */}
    {!compact&&!!habits.length&&<div className="habit-toolbar">
      <div className="date-control habit-date-control">
        <button className="icon-action" aria-label="היום הקודם" onClick={()=>moveDate(-1)}><ChevronRight size={17}/></button>
        <label className="sr-only" htmlFor="habit-date">יום לתיעוד</label>
        <input id="habit-date" aria-label="יום לתיעוד" type="date" value={selected} max={today} onChange={event=>{const next=event.target.value;if(next&&next<=today)setDate(next);}}/>
        <button className="icon-action" aria-label="היום הבא" onClick={()=>moveDate(1)} disabled={selected>=today}><ChevronLeft size={17}/></button>
        {selected!==today&&<button className="quiet-action today-jump" onClick={()=>setDate(today)}>חזרה להיום</button>}
      </div>
      {dueHabits.length!==habits.length&&<div className="filter-row" aria-label="סינון הרגלים">
        <button className={filter==='scheduled'?'selected':''} aria-pressed={filter==='scheduled'} onClick={()=>setFilter('scheduled')}>מתוכננים ליום</button>
        <button className={filter==='all'?'selected':''} aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>כל ההרגלים</button>
      </div>}
    </div>}

    {!!habits.length&&<div className="habit-summary" aria-label="סיכום ביצועי הרגלים">
      <div className="habit-summary-copy">
        <span>{selected===today?'היום':readableDate(selected)}</span>
        <strong key={cheer} className={cheer?'habit-cheer':undefined}>{dueHabits.length?completed+'/'+dueHabits.length:'—'}</strong>
        <small aria-live="polite">{dueHabits.length?(completed===dueHabits.length?'יום מושלם':'הושלמו'):'יום מנוחה מתוכנן'}</small>
        <small className="streak-line" aria-live="polite">{medal?<><Medal size={13} aria-hidden="true"/>מדליה חדשה · {medal}</>:perfect.current>=2&&<><Flame size={13} aria-hidden="true"/>{perfect.current} ימים מושלמים ברצף</>}</small>
      </div>
      {/* A drawn bar, not <progress>: it animates with a transform. */}
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div className="habit-progress" role="progressbar" aria-label="השלמת ההרגלים המתוכננים" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
        <span style={{'--pct':completionPercent/100} as CSSProperties}/>
      </div>
    </div>}

    {!compact&&!!visible.length&&<div className="habit-week-header" aria-hidden="true">
      {week.map(day=><div key={day}><span>{days[weekday(day)]}</span><b>{new Date(day+'T12:00:00Z').getUTCDate()}</b></div>)}
    </div>}

    <div className="habit-list">
      {visible.map(h=>{
        const target=habitTarget(h.data);
        const entry=entries.find(e=>e.data.habitId===h.id&&e.data.date===selected);
        const done=!!entry&&entry.data.done;
        const count=entry?entryCount(entry.data):0;
        const due=scheduled(h.data,selected);
        const streakDays=streak(h,entries,selected);
        const showSchedule=h.data.days.length!==7;
        const showStreak=streakDays>=2;
        const scheduleLabel=h.data.days.map(day=>days[day]).join(' · ');
        const HabitIcon=habitIcon(h.data.emoji);
        const stepsList=h.data.steps;
        const doneSteps=entry?entryStepsDone(entry.data):[];
        const nextStep=stepsList?stepsList.find((_,i)=>!doneSteps.includes(i)):undefined;
        const pillLabel=stepsList?(done?'איפוס כל השלבים של '+h.data.title:'סימון '+h.data.title+': '+nextStep):(done?'ביטול סימון ':'סימון ')+h.data.title+(target>1?' '+count+'/'+target:'');
        return <div key={h.id} className="habit-record">
          <div className="record-row">
            <span className="habit-emoji" aria-hidden="true"><HabitIcon size={20}/></span>
            <div className="record-body">
              <p>{h.data.title}</p>
              {(showStreak||showSchedule)&&<small className="habit-schedule">
                {showStreak&&<><Flame size={13} className="inline"/> {streakDays===1?'יום ביצוע ברצף':streakDays+' ימי ביצוע ברצף'}</>}
                {showStreak&&showSchedule&&' · '}
                {showSchedule&&scheduleLabel}
              </small>}
            </div>
            <div className="habit-actions">
              <button aria-label={pillLabel} aria-pressed={done} disabled={!due} className={'habit-mark '+(done?'checked':'')} onClick={()=>{tap();void (stepsList?togglePill(h,selected):toggle(h,selected)).catch(()=>{});}}>{done?<Check size={17}/>:due?(target>1?count+'/'+target:'סימון'):'מנוחה'}</button>
              <button className="icon-action" aria-label={'עריכת '+h.data.title} onClick={()=>edit(h)}><Pencil size={16}/></button>
            </div>
          </div>
          {stepsList&&<div className="habit-steps" aria-label={'שלבי '+h.data.title}>
            {stepsList.map((step,index)=>{
              const on=doneSteps.includes(index);
              return <button key={index} className={'habit-step '+(on?'checked':'')} aria-pressed={on} disabled={!due} aria-label={h.data.title+' '+step+(on?' בוצע':' לא בוצע')} onClick={()=>{tap();void toggleStep(h,selected,index).catch(()=>{});}}>{step}</button>;
            })}
          </div>}
          {!compact&&<div className="habit-history" aria-label={'שבוע קלנדרי: '+h.data.title}>
            {week.map(day=>{
              const dayEntry=entries.find(e=>e.data.habitId===h.id&&e.data.date===day);
              const dayCount=dayEntry?entryCount(dayEntry.data):0;
              const marked=!!dayEntry&&dayEntry.data.done;
              const partial=!marked&&dayCount>0&&dayCount<target;
              const canMark=day<=today&&scheduled(h.data,day);
              return <button key={day} className={marked?'marked':partial?'partial':canMark?'':'muted'} aria-label={h.data.title+' '+day+(marked?' בוצע':partial?' בוצע חלקית '+dayCount+'/'+target:day>today?' טרם הגיע':' לא בוצע')} aria-current={day===today?'date':undefined} aria-pressed={marked} disabled={!canMark} onClick={()=>{tap();void toggle(h,day).catch(()=>{});}}/>;
            })}
          </div>}
        </div>;
      })}
    </div>

    {!visible.length&&<Empty title={habits.length?'יום מנוחה מתוכנן':'הרגל קטן, התחלה טובה'} text={habits.length?'אין הרגלים מתוכננים ליום הזה. אפשר לבחור "כל ההרגלים" כדי לערוך את לוח הזמנים.':'בחר משהו שתרצה לעשות באופן קבוע.'} action="הוספת הרגל" onAction={()=>edit(null)}/>}

    {editing!==undefined&&<Editor title={editing?'עריכת הרגל':'הרגל חדש'} onClose={()=>setEditing(undefined)} onSave={form=>{const stepsRaw=field(form,'steps'),steps=stepsRaw?stepsRaw.split(',').map(s=>s.trim()).filter(Boolean):undefined;return save('habit',{title:field(form,'title'),emoji:field(form,'emoji'),startDate:field(form,'startDate'),days:form.getAll('days').map(Number),target:steps?steps.length:Number(field(form,'target'))||1,steps},editing||undefined);}} onDelete={editing?()=>{void save('habit',editing.data,editing,undefined,true).catch(()=>{});setEditing(undefined);}:undefined}>
      <Field label="שם ההרגל"><input name="title" required maxLength={200} defaultValue={editing?.data.title}/></Field>
      <div className="form-columns"><Field label="סמל"><select name="emoji" defaultValue={editing?.data.emoji||'🌱'}>{emojiOptions.map(([emoji,label])=><option key={emoji} value={emoji}>{label}</option>)}</select></Field><Field label="תאריך התחלה"><input name="startDate" type="date" required max={today} defaultValue={editing?.data.startDate||today}/></Field></div>
      <Field label="כמה פעמים ביום">{stepsLocked?<input key="locked" name="target" type="number" required min="1" max="10" step="1" value={stepNames.length} readOnly/>:<input key="free" name="target" type="number" required min="1" max="10" step="1" defaultValue={editing?habitTarget(editing.data):1}/>}</Field>
      {stepsLocked&&<p className="field-help">מתן שם לכל שלב קובע את הכמות היומית.</p>}
      <Field label="שלבים בהרגל (רשימה מופרדת בפסיקים, 2 עד 6, אופציונלי)"><input name="steps" maxLength={200} placeholder="קריאטין, מגנזיום, תוסף" value={stepsText} onChange={e=>setStepsText(e.target.value)}/></Field>
      <fieldset className="day-picker"><legend>באילו ימים?</legend>{days.map((day,index)=><label key={index}><input type="checkbox" name="days" value={index} defaultChecked={editing?editing.data.days.includes(index):true}/><span>{day}</span></label>)}</fieldset>
    </Editor>}
  </section>;
}
