export type TaskData={title:string;date:string;time:string;done:boolean;completedAt:string};
export type HabitData={title:string;emoji:string;days:number[];startDate:string;target?:number};
export type HabitEntryData={habitId:string;date:string;done:boolean;count?:number};
export type TransactionData={title:string;category:string;date:string;amount:number;direction:'expense'|'income';funder?:'me'|'dad'};
export type BudgetData={month:string;amount:number};
export type GoalData={title:string;target:number;current:number;unit:string;date:string};
export type CheckinData={date:string;mood:number;note:string};
export type SleepData={date:string;score:number;hours:number;note:string};
export type SettingsData={name:string};
export type DataMap={task:TaskData;habit:HabitData;habitEntry:HabitEntryData;transaction:TransactionData;budget:BudgetData;goal:GoalData;checkin:CheckinData;sleep:SleepData;settings:SettingsData};
export type Kind=keyof DataMap;
export type Entry<K extends Kind=Kind>={id:string;kind:K;data:DataMap[K];version:number;createdAt:string;updatedAt:string;deletedAt:string|null};
export const kinds:Kind[]=['task','habit','habitEntry','transaction','budget','goal','checkin','sleep','settings'];
// Legacy marker, not a category: older rows filed dad-funded charges under this
// bucket instead of a real category and a funder field. Still written by the
// Wallet Transaction automation through /api/hub, and still read here for
// backward compatibility via effectiveFunder/effectiveCategory below.
export const DAD_CATEGORY='הוצאות אבא';
export function effectiveFunder(t:TransactionData){return t.category===DAD_CATEGORY?'dad':(t.funder||'me');}
export function effectiveCategory(t:TransactionData){return t.category===DAD_CATEGORY?'אחר':t.category;}
export function todayKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dateOffset(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function weekday(date:string){return new Date(date+'T12:00:00Z').getUTCDay();}
export function calendarWeek(date:string){const start=dateOffset(date,-new Date(date+'T12:00:00Z').getUTCDay());return Array.from({length:7},(_,index)=>dateOffset(start,index));}
export function scheduled(h:HabitData,date:string){return date>=h.startDate&&h.days.includes(weekday(date));}
// target absent means 1 (today's exact behavior); count absent means the
// legacy done boolean, 1 or 0. Callers read progress through these instead
// of re-deriving the fallback rule themselves.
export function habitTarget(h:HabitData){return h.target||1;}
export function entryCount(e:HabitEntryData){return e.count??(e.done?1:0);}
export function streak(h:Entry<'habit'>,entries:Entry<'habitEntry'>[],date:string){const done=new Set(entries.filter(e=>!e.deletedAt&&e.data.habitId===h.id&&e.data.done).map(e=>e.data.date));let count=0;for(let i=0;i<36600;i++){const d=dateOffset(date,-i);if(d<h.data.startDate)break;if(!scheduled(h.data,d))continue;if(done.has(d))count++;else if(i!==0)break;}return count;}
export function money(cents:number){return new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2}).format(cents/100);}
function text(v:unknown,max=200,required=true):string {if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('טקסט חסר או ארוך מדי');return v.trim();}
function number(v:unknown,min=0,max=100000000000){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('מספר לא תקין');return v;}
function date(v:unknown,optional=false){if(optional&&v==='')return '';const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)throw new Error('תאריך לא תקין');return s;}
function cents(v:unknown){const n=number(v);if(!Number.isSafeInteger(n))throw new Error('סכום לא תקין');return n;}
function bool(v:unknown){if(typeof v!=='boolean')throw new Error('ערך לא תקין');return v;}
function target(v:unknown):number|undefined{if(v===undefined)return undefined;const n=number(v,1,10);if(!Number.isInteger(n))throw new Error('כמות יומית לא תקינה');return n;}
function count(v:unknown):number|undefined{if(v===undefined)return undefined;const n=number(v,0,1000);if(!Number.isInteger(n))throw new Error('כמות לא תקינה');return n;}
export function validate<K extends Kind>(kind:K,value:unknown):DataMap[K]{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('נתונים לא תקינים');const d=value as Record<string,unknown>;let result:unknown;
switch(kind){
case 'task':{const time=text(d.time,5,false);if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('שעה לא תקינה');const completedAt=text(d.completedAt,30,false);if(completedAt&&!Number.isFinite(Date.parse(completedAt)))throw new Error('תאריך השלמה לא תקין');result={title:text(d.title),date:date(d.date,true),time,done:bool(d.done),completedAt};break;}
case 'habit':{if(!Array.isArray(d.days)||d.days.length<1||d.days.length>7||d.days.some(x=>!Number.isInteger(x)||x<0||x>6))throw new Error('יש לבחור ימי ביצוע');result={title:text(d.title),emoji:text(d.emoji,12),days:[...new Set(d.days)],startDate:date(d.startDate),target:target(d.target)};break;}
case 'habitEntry':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לסמן הרגל בעתיד');result={habitId:text(d.habitId,100),date:day,done:bool(d.done),count:count(d.count)};break;}
case 'transaction':{if(d.direction!=='expense'&&d.direction!=='income')throw new Error('סוג תנועה לא תקין');if(cents(d.amount)<=0)throw new Error('הסכום חייב להיות חיובי');const funder=d.funder==='me'||d.funder==='dad'?d.funder:'me';result={title:text(d.title),category:text(d.category,80),date:date(d.date),amount:cents(d.amount),direction:d.direction,funder};break;}
case 'budget':{const month=text(d.month,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('חודש לא תקין');result={month,amount:cents(d.amount)};break;}
case 'goal':result={title:text(d.title),target:number(d.target,0.01),current:number(d.current),unit:text(d.unit,30),date:date(d.date,true)};break;
case 'checkin':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לתעד צ׳ק־אין בעתיד');const mood=number(d.mood,1,5);if(!Number.isInteger(mood))throw new Error('דירוג לא תקין');result={date:day,mood,note:text(d.note,3000,false)};break;}
case 'sleep':{const day=date(d.date);if(day>todayKey())throw new Error('לא ניתן לתעד שינה בעתיד');const score=number(d.score,0,100);const hours=number(d.hours,0,24);if(!score&&!hours)throw new Error('צריך ציון שינה או מספר שעות');result={date:day,score,hours,note:text(d.note,3000,false)};break;}
case 'settings':result={name:text(d.name,60)};break;
default:throw new Error('סוג רשומה לא תקין');}return result as DataMap[K];}
export function recordId(kind:Kind,data:DataMap[Kind],id:string){if(!/^[a-zA-Z0-9:_-]{1,140}$/.test(id))throw new Error('מזהה לא תקין');if(kind==='budget'&&id!=='budget:'+(data as BudgetData).month)throw new Error('מזהה תקציב לא תקין');if(kind==='habitEntry'&&id!=='entry:'+(data as HabitEntryData).habitId+':'+(data as HabitEntryData).date)throw new Error('מזהה הרגל לא תקין');if(kind==='checkin'&&id!=='checkin:'+(data as CheckinData).date)throw new Error('מזהה צ׳ק־אין לא תקין');if(kind==='sleep'&&id!=='sleep:'+(data as SleepData).date)throw new Error('מזהה שינה לא תקין');if(kind==='settings'&&id!=='settings')throw new Error('מזהה הגדרות לא תקין');return id;}
