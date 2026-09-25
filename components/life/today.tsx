'use client';
import {ArrowLeft,CheckCircle2,Flame,Moon,Smile,WalletCards} from 'lucide-react';import {formatSleepDuration,money,scheduled,todayKey} from '@/lib/life-model';import {select,useLife} from './use-life';import {FinanceView} from './finance';import {TasksView} from './tasks';import {HabitsView} from './habits';import {GoalsView,CheckinsView} from './goals';import {SleepView} from './sleep';import {buildFeed,FeedList} from './timeline';import type {View} from './nav';
export function TodayView({onNavigate}:{onNavigate:(view:View)=>void}){
  const {records}=useLife();const today=todayKey();
  const open=select(records,'task').filter(t=>!t.data.done);
  const dueToday=open.filter(t=>!t.data.date||t.data.date<=today).length,overdue=open.filter(t=>!!t.data.date&&t.data.date<today).length;
  const habits=select(records,'habit'),entries=select(records,'habitEntry');
  const due=habits.filter(h=>scheduled(h.data,today)),marked=due.filter(h=>entries.some(e=>e.data.habitId===h.id&&e.data.date===today&&e.data.done)).length;
  const spent=select(records,'transaction').filter(t=>t.data.date===today&&t.data.direction==='expense').reduce((sum,t)=>sum+t.data.amount,0);
  const checkin=select(records,'checkin').find(c=>c.data.date===today);
  const night=select(records,'sleep').find(n=>n.data.date===today);
  const feed=buildFeed(records).slice(0,4);
  const cards=[
    {key:'tasks',label:'משימות פתוחות להיום',value:String(dueToday),note:overdue?overdue+' באיחור':dueToday?'אפשר להתחיל':'אין מה שממתין',icon:CheckCircle2,view:'tasks' as View},
    {key:'habits',label:'הרגלים היום',value:due.length?marked+'/'+due.length:'—',note:!due.length?'אין הרגלים מתוכננים':marked===due.length?'סיימת הכול':'נשארו '+(due.length-marked),icon:Flame,view:'habits' as View},
    {key:'money',label:'הוצאות היום',value:money(spent),note:'מתעדכן עם כל תנועה',icon:WalletCards,view:'finance' as View},
    {key:'sleep',label:'ציון שינה',value:night?.data.score?String(night.data.score):'—',note:night?.data.hours?formatSleepDuration(night.data.hours)+' שעות':night?.data.score?'נשמר ללילה האחרון':'עוד לא תועד',icon:Moon,view:'sleep' as View},
    {key:'mood',label:'צ׳ק־אין',value:checkin?checkin.data.mood+'/5':'—',note:checkin?'נשמר להיום':'איך עבר עליך היום?',icon:Smile,view:'timeline' as View},
  ];
  return <div className="content-flow">
    <div className="today-summary">{cards.map(card=>{const Icon=card.icon;return <button key={card.key} className="summary-card" onClick={()=>onNavigate(card.view)}><span className="summary-icon"><Icon size={17}/></span><small>{card.label}</small><strong><bdi>{card.value}</bdi></strong><span className="summary-note">{card.note}</span></button>;})}</div>
    <div className="home-card"><FinanceView compact/></div>
    <div className="overview-grid">
      <div className="home-stack">
        <div className="home-card"><TasksView compact/></div>
        <div className="home-card"><section><header className="module-header"><div><h2>מה קרה לאחרונה</h2><p>כספים, משימות והרגלים ברצף אחד</p></div><button className="quiet-action" onClick={()=>onNavigate('timeline')}>לציר הזמן<ArrowLeft size={16}/></button></header>{feed.length?<FeedList items={feed}/>:<p className="feed-more">עוד לא נרשמה פעילות. כל דבר שתתעד יופיע כאן.</p>}</section></div>
      </div>
      <div className="home-stack">
        <div className="home-card"><SleepView compact/></div>
        <div className="home-card"><HabitsView compact/></div>
        <div className="home-card"><GoalsView compact/></div>
        <div className="home-card"><CheckinsView compact/></div>
      </div>
    </div>
  </div>;
}
