'use client';
import {Activity,Bed,BookOpen,Circle,Droplet,Dumbbell,Footprints,Sprout,Wind} from 'lucide-react';
import type {CSSProperties} from 'react';
import {dateOffset,entryCount,habitTarget,scheduled,todayKey,type Entry} from '@/lib/life-model';

// Same emoji-to-icon lookup habits.tsx renders with, kept local since that
// map is not exported and this view must not edit that file.
const emojiIcons:Record<string,typeof Circle>={'🌱':Sprout,'💧':Droplet,'📚':BookOpen,'🚶':Footprints,'🧘':Wind,'🏃':Activity,'💪':Dumbbell,'🛌':Bed};
function habitIcon(emoji:string){return emojiIcons[emoji]||Circle;}

const WINDOW=14;
function shortDay(date:string){return new Date(date+'T12:00:00Z').toLocaleDateString('he-IL',{day:'numeric',month:'numeric'});}

type MarkState='done'|'partial'|'missed'|'muted';
type DayMark={date:string;state:MarkState;label:string};

// A day is only "due" - and only then counted toward the aggregate - once it
// is both scheduled and not in the future. Everything else (future dates,
// days the habit did not yet exist for, days it is not scheduled on) reads
// as muted and is excluded from both numerator and denominator, so the
// aggregate never claims credit or blame for a day that was never asked of
// the habit.
function dayMark(h:Entry<'habit'>,entries:Entry<'habitEntry'>[],date:string,today:string):DayMark{
  const due=date<=today&&scheduled(h.data,date);
  if(!due)return {date,state:'muted',label:date>today?'טרם הגיע':'לא מתוכנן'};
  const entry=entries.find(e=>e.data.habitId===h.id&&e.data.date===date&&!e.deletedAt);
  const target=habitTarget(h.data);
  const count=entry?entryCount(entry.data):0;
  if(entry&&entry.data.done)return {date,state:'done',label:target>1?'בוצע '+count+'/'+target:'בוצע'};
  if(count>0)return {date,state:'partial',label:'בוצע חלקית '+count+'/'+target};
  return {date,state:'missed',label:'לא בוצע'};
}

export function HabitTrends({habits,entries,today=todayKey()}:{habits:Entry<'habit'>[];entries:Entry<'habitEntry'>[];today?:string}){
  if(!habits.length)return null;
  const days=Array.from({length:WINDOW},(_,i)=>dateOffset(today,-(WINDOW-1-i)));
  const rows=habits.map(h=>{
    const marks=days.map(date=>dayMark(h,entries,date,today));
    const dueDays=marks.filter(m=>m.state!=='muted').length;
    const completedDays=marks.filter(m=>m.state==='done').length;
    return {habit:h,marks,dueDays,completedDays};
  });
  const totalDue=rows.reduce((sum,r)=>sum+r.dueDays,0);
  const totalCompleted=rows.reduce((sum,r)=>sum+r.completedDays,0);
  const overallPercent=totalDue?Math.round(totalCompleted/totalDue*100):0;

  return <section className="habit-trends" aria-labelledby="habit-trends-title">
    <header className="habit-trends-header">
      <h3 id="habit-trends-title">מגמת ההרגלים</h3>
      <p>14 הימים האחרונים</p>
    </header>
    <div className="habit-summary habit-trends-summary" aria-label="סיכום השלמה כולל">
      <div className="habit-summary-copy">
        <span>השלמה כוללת</span>
        <strong className="num">{totalDue?overallPercent+'%':'—'}</strong>
        <small>{totalDue?totalCompleted+' מתוך '+totalDue+' ימים מתוכננים':'אין עדיין ימים מתוכננים בטווח הזה'}</small>
      </div>
      <div className="habit-progress" aria-hidden="true">
        <span style={{'--pct':overallPercent/100} as CSSProperties}/>
      </div>
    </div>
    <ul className="habit-trend-legend" aria-hidden="true">
      <li><i className="mark done"/>בוצע</li>
      <li><i className="mark partial"/>חלקי</li>
      <li><i className="mark missed"/>לא בוצע</li>
      <li><i className="mark muted"/>לא מתוכנן</li>
    </ul>
    <ul className="habit-trend-list">
      {rows.map(({habit,marks,dueDays,completedDays})=>{
        const HabitIcon=habitIcon(habit.data.emoji);
        return <li key={habit.id} className="habit-trend-row">
          <div className="habit-trend-title">
            <span className="habit-emoji" aria-hidden="true"><HabitIcon size={18}/></span>
            <span>{habit.data.title}</span>
          </div>
          <figure className="habit-trend-strip" aria-label={habit.data.title+': '+completedDays+' מתוך '+dueDays+' ימים מתוכננים הושלמו ב-14 הימים האחרונים'}>
            {marks.map(m=><span key={m.date} className={'trend-day '+m.state} aria-hidden="true" title={shortDay(m.date)+' · '+m.label}/>)}
          </figure>
          <span className="habit-trend-ratio num">{dueDays?completedDays+'/'+dueDays:'—'}</span>
        </li>;
      })}
    </ul>
  </section>;
}
