import {json} from '@/lib/auth';
import {DAD_CATEGORY,money,scheduled,streak,todayKey,validate,type Entry} from '@/lib/life-model';
import {allRecords,oneRecord} from '@/lib/life-store';
import {authorized,database,readBody,upsert} from '@/lib/shortcuts';

const HABIT='הרגל: ',GOAL='מטרה: ',SLEEP='ציון שינה',CHECKIN='צ׳ק־אין',EXPENSE='הוצאה',DAD='הוצאת אבא',TASK='משימה';

function hint(label:string,note:string){return note?label+' ('+note+')':label;}
function strip(choice:string){return choice.replace(/\s*\([^()]*\)\s*$/,'').trim();}
function numbers(text:string){return (text.match(/-?\d+(?:[.,]\d+)?/g)||[]).map(n=>Number(n.replace(',','.')));}
// Drops the leading number and any leftover punctuation — a currency symbol
// arriving from Wallet must not end up as the description.
function words(text:string){return text.replace(/-?\d+(?:[.,]\d+)?/,'').trim().split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w));}

type State=Awaited<ReturnType<typeof load>>;

async function load(){
  const today=todayKey();
  const all=await allRecords();
  const live=all.filter(r=>!r.deletedAt);
  const habits=live.filter(r=>r.kind==='habit') as Entry<'habit'>[];
  const entries=live.filter(r=>r.kind==='habitEntry') as Entry<'habitEntry'>[];
  const tasks=live.filter(r=>r.kind==='task') as Entry<'task'>[];
  const goals=live.filter(r=>r.kind==='goal') as Entry<'goal'>[];
  const transactions=live.filter(r=>r.kind==='transaction') as Entry<'transaction'>[];
  const month=today.slice(0,7);
  const budget=live.find(r=>r.id==='budget:'+month) as Entry<'budget'>|undefined;
  const checkin=live.find(r=>r.id==='checkin:'+today);
  const sleep=live.find(r=>r.id==='sleep:'+today);
  const due=habits.filter(h=>scheduled(h.data,today));
  const marked=(h:Entry<'habit'>)=>entries.some(e=>e.data.habitId===h.id&&e.data.date===today&&e.data.done);
  return {today,month,habits,entries,tasks,goals,transactions,budget,checkin,sleep,due,marked};
}

function summary(s:State){
  const open=s.tasks.filter(t=>!t.data.done);
  const overdue=open.filter(t=>!!t.data.date&&t.data.date<s.today).length;
  const done=s.due.filter(s.marked).length;
  const spent=s.transactions.filter(t=>t.data.date.startsWith(s.month)&&t.data.direction==='expense').reduce((n,t)=>n+t.data.amount,0);
  const parts=[open.length+' משימות פתוחות'];
  if(overdue)parts.push(overdue+' באיחור');
  if(s.due.length)parts.push('הרגלים '+done+'/'+s.due.length);
  if(s.budget)parts.push('נשאר '+money(s.budget.data.amount-spent));
  else parts.push('הוצאות החודש '+money(spent));
  return parts.join(' · ');
}

// Sleep and the father's-card expense are deliberately absent from the menu.
// Sleep has its own shortcut that asks with a number pad and posts to
// /api/sleep; the father's card is logged hands-free by the Wallet Transaction
// automation. Their branches in POST still work if something sends them —
// the automation depends on DAD — they just aren't offered as menu choices.
function menu(s:State){
  const items:string[]=[];
  for(const h of s.due)if(!s.marked(h))items.push(hint(HABIT+h.data.title,'רצף '+streak(h,s.entries,s.today)));
  if(!s.checkin)items.push(hint(CHECKIN,'1-5 ואז הערה'));
  items.push(hint(EXPENSE,'סכום קטגוריה תיאור'));
  items.push(hint(TASK,'מה צריך לעשות'));
  for(const g of s.goals.filter(g=>g.data.current<g.data.target))items.push(hint(GOAL+g.data.title,g.data.current+'/'+g.data.target+' '+g.data.unit));
  if(s.checkin)items.push(hint(CHECKIN,'עדכון'));
  return items;
}

function plainText(body:string,status=200){return new Response(body,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function wantsPlain(request:Request){return new URL(request.url).searchParams.get('plain')==='1';}

export async function GET(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const s=await load();
    // plain=1 answers with a bare JSON array so Shortcuts can pipe it straight
    // into Choose from List — no dictionary unwrapping actions needed.
    if(wantsPlain(request))return json(menu(s));
    return json({summary:summary(s),menu:menu(s)});
  }catch{return json({error:'storage_unavailable'},503);}
}

async function markHabit(s:State,title:string){
  const habit=s.habits.find(h=>h.data.title.trim().toLowerCase()===title.trim().toLowerCase());
  if(!habit)throw new Error('ההרגל "'+title+'" לא נמצא');
  const id='entry:'+habit.id+':'+s.today;
  const existing=await oneRecord(id);
  const data=validate('habitEntry',{habitId:habit.id,date:s.today,done:true});
  await upsert(database(),id,'habitEntry',data,existing?.version);
  const entries=[...s.entries.filter(e=>e.id!==id),{...existing,id,kind:'habitEntry',data,version:1,createdAt:'',updatedAt:'',deletedAt:null} as Entry<'habitEntry'>];
  return 'סומן: '+habit.data.title+' · רצף '+streak(habit,entries,s.today);
}

async function updateGoal(s:State,title:string,value:string){
  const goal=s.goals.find(g=>g.data.title.trim().toLowerCase()===title.trim().toLowerCase());
  if(!goal)throw new Error('המטרה "'+title+'" לא נמצאה');
  const [delta]=numbers(value);
  if(delta===undefined)throw new Error('צריך מספר: כמה להוסיף למטרה');
  const data=validate('goal',{...goal.data,current:Math.max(0,goal.data.current+delta)});
  await upsert(database(),goal.id,'goal',data,goal.version);
  const pct=Math.min(100,Math.round(data.current/data.target*100));
  return goal.data.title+': '+data.current+'/'+data.target+' '+data.unit+' ('+pct+'%)'+(pct>=100?' — הגעת ליעד!':'');
}

async function recordSleep(s:State,value:string){
  const [first,second]=numbers(value);
  if(first===undefined)throw new Error('צריך ציון שינה (0-100), ואפשר גם שעות אחריו');
  const id='sleep:'+s.today;
  const existing=await oneRecord(id);
  const data=validate('sleep',{date:s.today,score:first,hours:second??0,note:''});
  await upsert(database(),id,'sleep',data,existing?.version);
  return 'שינה נשמרה: ציון '+data.score+(data.hours?' · '+data.hours+' שעות':'');
}

async function recordCheckin(s:State,value:string){
  const [mood]=numbers(value);
  if(mood===undefined)throw new Error('צריך דירוג 1-5, ואפשר הערה אחריו');
  const id='checkin:'+s.today;
  const existing=await oneRecord(id);
  const data=validate('checkin',{date:s.today,mood:Math.round(mood),note:words(value).join(' ')});
  await upsert(database(),id,'checkin',data,existing?.version);
  return 'צ׳ק־אין נשמר: '+data.mood+'/5'+(data.note?' · '+data.note:'');
}

async function recordExpense(s:State,value:string,fixedCategory?:string){
  const [amount]=numbers(value);
  if(amount===undefined||amount<=0)throw new Error('צריך סכום');
  const rest=words(value);
  const category=fixedCategory||rest.shift()||'אחר';
  const title=rest.join(' ')||(fixedCategory?'חיוב באשראי של אבא':category);
  const data=validate('transaction',{title,category,date:s.today,amount:Math.round(amount*100),direction:'expense'});
  await upsert(database(),crypto.randomUUID(),'transaction',data,undefined);
  return 'נרשמה הוצאה: '+money(data.amount)+' · '+category+(title!==category?' · '+title:'');
}

async function createTask(s:State,value:string){
  if(!value)throw new Error('צריך לכתוב מה לעשות');
  const data=validate('task',{title:value,date:'',time:'',done:false,completedAt:''});
  await upsert(database(),crypto.randomUUID(),'task',data,undefined);
  return 'נוספה משימה: '+data.title;
}

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    const choice=strip(typeof input.choice==='string'?input.choice:'');
    const value=(typeof input.value==='string'?input.value:'').trim();
    if(!choice)throw new Error('לא נבחרה פעולה');
    const s=await load();
    let message:string;
    if(choice.startsWith(HABIT))message=await markHabit(s,choice.slice(HABIT.length));
    else if(choice.startsWith(GOAL))message=await updateGoal(s,choice.slice(GOAL.length),value);
    else if(choice===SLEEP)message=await recordSleep(s,value);
    else if(choice===CHECKIN)message=await recordCheckin(s,value);
    else if(choice===DAD)message=await recordExpense(s,value,DAD_CATEGORY);
    else if(choice===EXPENSE)message=await recordExpense(s,value);
    else if(choice===TASK)message=await createTask(s,value);
    else throw new Error('פעולה לא מוכרת: '+choice);
    // plain=1 answers with the confirmation as bare text, so Shortcuts can
    // Show Result on it directly instead of unwrapping a dictionary.
    if(wantsPlain(request))return plainText(message);
    return json({ok:true,message});
  }catch(e){
    const text=e instanceof Error?e.message:'';
    if(text==='request_too_large')return json({error:text},413);
    if(text==='storage_unavailable')return json({error:text},503);
    if(wantsPlain(request))return plainText(text||'הבקשה לא הצליחה',400);
    return json({error:text||'invalid_request',message:text},400);
  }
}
