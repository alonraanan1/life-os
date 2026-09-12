'use client';
import {useState} from 'react';import {ArrowDownLeft,ArrowUpLeft,Check,Flame,Moon,Smile,Target} from 'lucide-react';import {dateOffset,money,todayKey,type Entry} from '@/lib/life-model';import {select,useLife} from './use-life';import {Empty} from './editor';
export type FeedType='expense'|'income'|'task'|'habit'|'checkin'|'goal'|'sleep';
export type FeedItem={id:string;type:FeedType;title:string;detail:string;value:string;date:string;at:string};
const moods=['','יום קשה','פחות טוב','בסדר','טוב','מצוין'];
const icons:Record<FeedType,typeof Check>={expense:ArrowDownLeft,income:ArrowUpLeft,task:Check,habit:Flame,checkin:Smile,goal:Target,sleep:Moon};
const groupsOf:Record<string,FeedType[]>={money:['expense','income'],task:['task'],habit:['habit'],checkin:['checkin','goal'],sleep:['sleep']};
export function buildFeed(records:Entry[]):FeedItem[]{
  const habits=select(records,'habit');const named=(id:string)=>habits.find(h=>h.id===id)?.data.title||'הרגל שנמחק';const items:FeedItem[]=[];
  for(const t of select(records,'transaction'))items.push({id:t.id,type:t.data.direction,title:t.data.title,detail:t.data.category,value:(t.data.direction==='income'?'+':'−')+money(t.data.amount),date:t.data.date,at:t.createdAt});
  for(const t of select(records,'task'))if(t.data.done)items.push({id:t.id,type:'task',title:t.data.title,detail:'משימה הושלמה',value:'הושלם',date:(t.data.completedAt||'').slice(0,10)||t.data.date||t.updatedAt.slice(0,10),at:t.data.completedAt||t.updatedAt});
  for(const e of select(records,'habitEntry'))if(e.data.done)items.push({id:e.id,type:'habit',title:named(e.data.habitId),detail:'הרגל בוצע',value:'+1',date:e.data.date,at:e.updatedAt});
  for(const c of select(records,'checkin'))items.push({id:c.id,type:'checkin',title:c.data.note||('הרגשה: '+moods[c.data.mood]),detail:'צ׳ק־אין יומי',value:c.data.mood+'/5',date:c.data.date,at:c.updatedAt});
  for(const g of select(records,'goal'))if(g.data.current>=g.data.target)items.push({id:g.id,type:'goal',title:g.data.title,detail:'הגעת ליעד',value:g.data.target+' '+g.data.unit,date:g.updatedAt.slice(0,10),at:g.updatedAt});
  for(const n of select(records,'sleep'))items.push({id:n.id,type:'sleep',title:n.data.hours?n.data.hours+' שעות שינה':'לילה תועד',detail:'ציון שינה',value:n.data.score?String(n.data.score):'—',date:n.data.date,at:n.updatedAt});
  return items.filter(i=>/^\d{4}-\d{2}-\d{2}$/.test(i.date)).sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at));
}
export function dayLabel(date:string,today:string){if(date===today)return 'היום';if(date===dateOffset(today,-1))return 'אתמול';return new Date(date+'T12:00:00Z').toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'});}
export function FeedList({items}:{items:FeedItem[]}){return <div className="feed-list">{items.map(item=>{const Icon=icons[item.type];return <div className="feed-row" key={item.type+':'+item.id}><span className={'activity-icon '+item.type}><Icon size={17}/></span><div className="feed-body"><p>{item.title}</p><small>{item.detail}</small></div><bdi className={'feed-value '+item.type}>{item.value}</bdi></div>;})}</div>;}
export function TimelineView(){
  const {records}=useLife();const today=todayKey();const [filter,setFilter]=useState('all');
  const all=buildFeed(records);const kinds=groupsOf[filter];const shown=(kinds?all.filter(i=>kinds.includes(i.type)):all).slice(0,300);
  const days=shown.reduce<[string,FeedItem[]][]>((acc,item)=>{const last=acc[acc.length-1];if(last&&last[0]===item.date)last[1].push(item);else acc.push([item.date,[item]]);return acc;},[]);
  return <section><header className="module-header"><div><h2>הסיפור שלך</h2><p>{all.length?all.length+' רגעים מתועדים':'עוד לא נרשמה פעילות'}</p></div></header>
  <div className="filter-row" aria-label="סינון ציר הזמן">{[['all','הכל'],['money','כספים'],['task','משימות'],['habit','הרגלים'],['sleep','שינה'],['checkin','רגעים אישיים']].map(([id,label])=><button key={id} aria-pressed={filter===id} className={filter===id?'selected':''} onClick={()=>setFilter(id)}>{label}</button>)}</div>
  {days.map(([date,items])=><div className="feed-day" key={date}><h3>{dayLabel(date,today)}</h3><FeedList items={items}/></div>)}
  {!shown.length&&<Empty title={all.length?'אין פעילות בתצוגה הזאת':'הסיפור שלך מתחיל עכשיו'} text={all.length?'אפשר לבחור מסנן אחר.':'כל משימה, הוצאה או הרגל שתתעד יופיעו כאן ברצף אחד.'}/>}
  {all.length>shown.length&&<p className="feed-more">מוצגים {shown.length} הרגעים האחרונים מתוך {all.length}.</p>}</section>;
}
