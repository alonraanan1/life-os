export type TaskData={title:string;date:string;time:string;done:boolean;completedAt:string};
export type HabitData={title:string;emoji:string;days:number[];startDate:string;target?:number;steps?:string[]};
export type HabitEntryData={habitId:string;date:string;done:boolean;count?:number;stepsDone?:number[]};
export type TransactionData={title:string;category:string;date:string;amount:number;direction:'expense'|'income';funder?:'me'|'dad';location?:string;reviewStatus?:'pending'|'complete';source?:'wallet'|'bank'};
export type BudgetData={month:string;amount:number};
export type DadPaymentData={date:string;amount:number};
export type GoalData={title:string;target:number;current:number;unit:string;date:string};
export type CheckinData={date:string;mood:number;note:string};
export type SleepData={date:string;score:number;hours:number;note:string};
export type SettingsData={name:string};
export type DataMap={task:TaskData;habit:HabitData;habitEntry:HabitEntryData;transaction:TransactionData;budget:BudgetData;goal:GoalData;checkin:CheckinData;sleep:SleepData;settings:SettingsData;dadPayment:DadPaymentData};
export type Kind=keyof DataMap;
export type Entry<K extends Kind=Kind>={id:string;kind:K;data:DataMap[K];version:number;createdAt:string;updatedAt:string;deletedAt:string|null};
export const kinds:Kind[]=['task','habit','habitEntry','transaction','budget','goal','checkin','sleep','settings','dadPayment'];
// Legacy marker, not a category: older rows filed dad-funded charges under this
// bucket instead of a real category and a funder field. Still written by the
// Wallet Transaction automation through /api/hub, and still read here for
// backward compatibility via effectiveFunder/effectiveCategory below.
export const DAD_CATEGORY='הוצאות אבא';
export function effectiveFunder(t:TransactionData){return t.category===DAD_CATEGORY?'dad':(t.funder||'me');}
export function effectiveCategory(t:TransactionData){return t.category===DAD_CATEGORY?'אחר':t.category;}
export function expenseMissingFields(t:TransactionData):Array<'title'|'category'|'location'>{
  const missing:Array<'title'|'category'|'location'>=[];
  if(!t.title.trim()||['חיוב חדש','חיוב ללא בית עסק','חיוב באשראי של אבא'].includes(t.title.trim()))missing.push('title');
  if(!t.category.trim()||t.category==='לבירור'||t.category===DAD_CATEGORY)missing.push('category');
  if(effectiveFunder(t)==='dad'&&!t.location?.trim())missing.push('location');
  return missing;
}
export function todayKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dateOffset(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function weekday(date:string){return new Date(date+'T12:00:00Z').getUTCDay();}
export function calendarWeek(date:string){const start=dateOffset(date,-new Date(date+'T12:00:00Z').getUTCDay());return Array.from({length:7},(_,index)=>dateOffset(start,index));}
export function scheduled(h:HabitData,date:string){return date>=h.startDate&&h.days.includes(weekday(date));}
// steps, when present, defines the daily target - a stored target is
// ignored so it can never drift from the step list. Otherwise target absent
// means 1 (today's exact behavior). count absent means the legacy done
// boolean, 1 or 0. Callers read progress through these instead of
// re-deriving the fallback rule themselves.
export function habitTarget(h:HabitData){return h.steps?h.steps.length:h.target||1;}
export function entryCount(e:HabitEntryData){return e.count??(e.done?1:0);}
// Which step indices a day's entry has done. A legacy entry (count/done but
// no stepsDone) has no record of *which* steps, so it defaults to the first
// `count` of them - good enough to render, and never trusted for writes,
// since every write recomputes stepsDone/count/done together (see
// toggleHabitStep). Tolerant of an index a later habit edit removed: it is
// simply not among the current step indices when read back.
export function entryStepsDone(e:HabitEntryData):number[]{return e.stepsDone??Array.from({length:entryCount(e)},(_,i)=>i);}
export function pendingHabitItems(habits:Entry<'habit'>[],entries:Entry<'habitEntry'>[],day:string){
  return habits.filter(h=>!h.deletedAt&&scheduled(h.data,day)).flatMap((h):{habitId:string;title:string;stepIndex?:number}[]=>{
    const entry=entries.find(e=>!e.deletedAt&&e.data.habitId===h.id&&e.data.date===day);
    if(entry?.data.done)return [];
    const target=habitTarget(h.data);
    if(h.data.steps){
      const done=entry?entryStepsDone(entry.data):[];
      return h.data.steps.flatMap((step,index)=>done.includes(index)?[]:[{habitId:h.id,stepIndex:index,title:h.data.title+': '+step}]);
    }
    const remaining=Math.max(0,target-(entry?entryCount(entry.data):0));
    return remaining?[{habitId:h.id,title:target===1?h.data.title:h.data.title+' — נשארו '+remaining+' מתוך '+target}]:[];
  });
}
// The one place that mutates a day's step set: toggles `index` in or out and
// derives count/done from the result, so they can never disagree with it.
// An index at or past `target` is a step a later habit edit removed; it is
// dropped here, or a day could count a deleted step toward done.
export function toggleHabitStep(current:number[],index:number,target:number){const stepsDone=(current.includes(index)?current.filter(i=>i!==index):[...current,index]).filter(i=>i<target).sort((a,b)=>a-b);return {stepsDone,count:stepsDone.length,done:stepsDone.length>=target};}
// The stepped habit's mark pill uses the same gesture a numeric habit's mark
// button already has: mark the next unmarked step, and a complete day clears
// every step. Both paths fold over toggleHabitStep - picking which index (or
// indices) to toggle - rather than recomputing stepsDone/count/done a second
// way, so that rule stays defined in exactly one place.
export function toggleHabitPill(current:number[],target:number){const valid=current.filter(i=>i<target);return valid.length>=target?valid.reduce((acc,index)=>toggleHabitStep(acc.stepsDone,index,target),{stepsDone:valid,count:0,done:false}):toggleHabitStep(valid,Array.from({length:target},(_,i)=>i).find(i=>!valid.includes(i))??0,target);}
// The server settles `done` from the habit's current target, as the Shortcut
// routes do, so a screen holding an older version of the habit cannot store a
// day as done (or not) against a target that has since changed. An entry with
// no count is a legacy boolean mark and is kept as sent.
export function settleEntry(h:HabitData,e:HabitEntryData):HabitEntryData{const target=habitTarget(h),steps=h.steps&&e.stepsDone?e.stepsDone.filter(i=>i<target):undefined,count=steps?steps.length:e.count;return count===undefined?e:{...e,...(steps?{stepsDone:steps}:{}),count,done:count>=target};}
// Shortcut calls add progress without wrapping a completed day back to zero.
// Preserve named-step identity even when an older shortcut supplies only a count.
export function advanceHabit(h:HabitData,previous:HabitEntryData|undefined,amount=1){
  const target=habitTarget(h);
  if(h.steps){
    let stepsDone=(previous?entryStepsDone(previous):[]).filter(i=>i<target);
    const additions=Math.min(amount,Math.max(0,target-stepsDone.length));
    for(let i=0;i<additions;i++)stepsDone=toggleHabitPill(stepsDone,target).stepsDone;
    return {stepsDone,count:stepsDone.length,done:stepsDone.length>=target};
  }
  const count=Math.min(target,(previous?entryCount(previous):0)+amount);
  return {count,done:count>=target};
}
export function streak(h:Entry<'habit'>,entries:Entry<'habitEntry'>[],date:string){const done=new Set(entries.filter(e=>!e.deletedAt&&e.data.habitId===h.id&&e.data.done).map(e=>e.data.date));let count=0;for(let i=0;i<36600;i++){const d=dateOffset(date,-i);if(d<h.data.startDate)break;if(!scheduled(h.data,d))continue;if(done.has(d))count++;else if(i!==0)break;}return count;}
// A perfect day has at least one habit due and every due habit done; days with
// nothing due are skipped, and `date` itself still pending doesn't break the run.
// `best` is the longest run ever, so a medal once earned survives a later miss.
export function perfectStreaks(habits:Entry<'habit'>[],entries:Entry<'habitEntry'>[],date:string){
  const live=habits.filter(h=>!h.deletedAt),done=new Set(entries.filter(e=>!e.deletedAt&&e.data.done).map(e=>e.data.habitId+'|'+e.data.date));
  let run=0,best=0;
  // Starts at the first done mark: no earlier day can be perfect, and a 1900 startDate can't cost 46k loops.
  for(let d=[...done].map(k=>k.slice(-10)).sort()[0];d&&d<=date;d=dateOffset(d,1)){
    const due=live.filter(h=>scheduled(h.data,d));
    if(!due.length)continue;
    if(due.every(h=>done.has(h.id+'|'+d)))best=Math.max(best,++run);else if(d!==date)run=0;
  }
  return {current:run,best};
}
// Days in a row, ending today, on which this month's spending so far stayed
// within the pro-rata budget: the same rule as the budget meter, so they agree.
// Payments settle the oldest charges first, so what is still owed for a month
// is the part of the open balance that later months have not already taken.
export function dadDebt(transactions:TransactionData[],payments:DadPaymentData[],month:string){
  const charges=transactions.filter(t=>t.direction==='expense'&&effectiveFunder(t)==='dad'),sum=(list:{amount:number}[])=>list.reduce((n,x)=>n+x.amount,0);
  const open=Math.max(0,sum(charges)-sum(payments)),later=sum(charges.filter(t=>t.date.slice(0,7)>month));
  return {open,month:Math.min(sum(charges.filter(t=>t.date.startsWith(month))),Math.max(0,open-later))};
}
export function budgetStreak(transactions:TransactionData[],budget:number,today:string){
  const month=today.slice(0,7),day=Number(today.slice(8)),days=new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7)),0)).getUTCDate(),spent=Array(day+1).fill(0);
  for(const t of transactions)if(t.direction==='expense'&&t.date.startsWith(month)&&t.date<=today)spent[Number(t.date.slice(8))]+=t.amount;
  let total=0,run=0;for(let d=1;d<=day;d++){total+=spent[d];run=total<=budget*d/days?run+1:0;}
  return budget>0?run:0;
}
export const MEDAL_STREAKS=[3,7,14,30,100,365],MEDAL_MARKS=[10,50,100,500,1000];
// `signed` lets Intl place the +/- itself, with the direction marks that keep
// it beside the digits; a sign glued on by hand lands on the wrong side in RTL.
// The app's short date, as Israelis write it: 22/09 (and 22/09/26 with the year).
export function dayMonth(date:string,year=false){return date.slice(8,10)+'/'+date.slice(5,7)+(year?'/'+date.slice(2,4):'');}
export function money(cents:number,signed=false){return new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2,signDisplay:signed?'exceptZero':'auto'}).format(cents/100);}
// The stored value remains decimal hours for old records and API clients.
// In the interface, duration is entered and displayed as hours plus real minutes.
export function sleepParts(value:number){
  if(!Number.isFinite(value)||value<0||value>24)throw new Error('משך שינה לא תקין');
  const total=Math.round(value*60);
  return {hours:Math.floor(total/60),minutes:total%60};
}
export function sleepHoursFromParts(hours:number,minutes:number){
  if(!Number.isInteger(hours)||!Number.isInteger(minutes)||hours<0||hours>24||minutes<0||minutes>59||(hours===24&&minutes>0))throw new Error('יש להזין דקות בין 0 ל־59');
  return (hours*60+minutes)/60;
}
export function formatSleepDuration(value:number){const {hours,minutes}=sleepParts(value);return hours+':'+String(minutes).padStart(2,'0');}
function text(v:unknown,max=200,required=true):string {if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('טקסט חסר או ארוך מדי');return v.trim();}
function number(v:unknown,min=0,max=100000000000){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('מספר לא תקין');return v;}
function date(v:unknown,optional=false){if(optional&&v==='')return '';const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)throw new Error('תאריך לא תקין');return s;}
function cents(v:unknown){const n=number(v);if(!Number.isSafeInteger(n))throw new Error('סכום לא תקין');return n;}
function bool(v:unknown){if(typeof v!=='boolean')throw new Error('ערך לא תקין');return v;}
function target(v:unknown):number|undefined{if(v===undefined)return undefined;const n=number(v,1,10);if(!Number.isInteger(n))throw new Error('כמות יומית לא תקינה');return n;}
function count(v:unknown):number|undefined{if(v===undefined)return undefined;const n=number(v,0,1000);if(!Number.isInteger(n))throw new Error('כמות לא תקינה');return n;}
function steps(v:unknown):string[]|undefined{if(v===undefined)return undefined;if(!Array.isArray(v)||v.length<2||v.length>6)throw new Error('צריך בין 2 ל-6 שלבים');const list=v.map(s=>text(s,30));if(new Set(list).size!==list.length)throw new Error('שמות השלבים חייבים להיות שונים');return list;}
function stepsDone(v:unknown):number[]|undefined{if(v===undefined)return undefined;if(!Array.isArray(v)||v.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error('שלבים לא תקינים');return [...new Set(v)].sort((a,b)=>a-b);}
export function validate<K extends Kind>(kind:K,value:unknown):DataMap[K]{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('נתונים לא תקינים');const d=value as Record<string,unknown>;let result:unknown;
switch(kind){
case 'task':{const time=text(d.time,5,false);if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('שעה לא תקינה');const completedAt=text(d.completedAt,30,false);if(completedAt&&!Number.isFinite(Date.parse(completedAt)))throw new Error('תאריך השלמה לא תקין');result={title:text(d.title),date:date(d.date,true),time,done:bool(d.done),completedAt};break;}
case 'habit':{if(!Array.isArray(d.days)||d.days.length<1||d.days.length>7||d.days.some(x=>!Number.isInteger(x)||x<0||x>6))throw new Error('יש לבחור ימי ביצוע');result={title:text(d.title),emoji:text(d.emoji,12),days:[...new Set(d.days)],startDate:date(d.startDate),target:target(d.target),steps:steps(d.steps)};break;}
case 'habitEntry':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לסמן הרגל בעתיד');result={habitId:text(d.habitId,100),date:day,done:bool(d.done),count:count(d.count),stepsDone:stepsDone(d.stepsDone)};break;}
case 'transaction':{if(d.direction!=='expense'&&d.direction!=='income')throw new Error('סוג תנועה לא תקין');if(cents(d.amount)<=0)throw new Error('הסכום חייב להיות חיובי');const funder=d.funder==='me'||d.funder==='dad'?d.funder:'me';if(d.reviewStatus!==undefined&&d.reviewStatus!=='pending'&&d.reviewStatus!=='complete')throw new Error('מצב בדיקה לא תקין');if(d.source!==undefined&&d.source!=='wallet'&&d.source!=='bank')throw new Error('מקור חיוב לא תקין');result={title:text(d.title),category:text(d.category,80),date:date(d.date),amount:cents(d.amount),direction:d.direction,funder,...(d.location===undefined?{}:{location:text(d.location,200,false)}),...(d.reviewStatus===undefined?{}:{reviewStatus:d.reviewStatus}),...(d.source===undefined?{}:{source:d.source})};break;}
case 'budget':{const month=text(d.month,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('חודש לא תקין');result={month,amount:cents(d.amount)};break;}
case 'goal':result={title:text(d.title),target:number(d.target,0.01),current:number(d.current),unit:text(d.unit,30),date:date(d.date,true)};break;
case 'checkin':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לתעד צ׳ק־אין בעתיד');const mood=number(d.mood,1,5);if(!Number.isInteger(mood))throw new Error('דירוג לא תקין');result={date:day,mood,note:text(d.note,3000,false)};break;}
case 'sleep':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לתעד שינה בעתיד');const score=number(d.score,0,100);const hours=number(d.hours,0,24);if(!score&&!hours)throw new Error('צריך ציון שינה או מספר שעות');result={date:day,score,hours,note:text(d.note,3000,false)};break;}
case 'settings':result={name:text(d.name,60)};break;
case 'dadPayment':{if(cents(d.amount)<=0)throw new Error('הסכום חייב להיות חיובי');result={date:date(d.date),amount:cents(d.amount)};break;}
default:throw new Error('סוג רשומה לא תקין');}return result as DataMap[K];}
export function recordId(kind:Kind,data:DataMap[Kind],id:string){if(!/^[a-zA-Z0-9:_-]{1,140}$/.test(id))throw new Error('מזהה לא תקין');if(kind==='budget'&&id!=='budget:'+(data as BudgetData).month)throw new Error('מזהה תקציב לא תקין');if(kind==='habitEntry'&&id!=='entry:'+(data as HabitEntryData).habitId+':'+(data as HabitEntryData).date)throw new Error('מזהה הרגל לא תקין');if(kind==='checkin'&&id!=='checkin:'+(data as CheckinData).date)throw new Error('מזהה צ׳ק־אין לא תקין');if(kind==='sleep'&&id!=='sleep:'+(data as SleepData).date)throw new Error('מזהה שינה לא תקין');if(kind==='settings'&&id!=='settings')throw new Error('מזהה הגדרות לא תקין');return id;}
