import {json} from '@/lib/auth';
import {advanceHabit,entryStepsDone,habitTarget,pendingHabitItems,todayKey,toggleHabitStep,validate,type Entry,type HabitEntryData} from '@/lib/life-model';
import {allRecords,oneRecord} from '@/lib/life-store';
import {authorized,database,readBody,upsert} from '@/lib/shortcuts';

export async function GET(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const all=await allRecords();
    const habits=all.filter((r):r is Entry<'habit'>=>r.kind==='habit');
    const entries=all.filter((r):r is Entry<'habitEntry'>=>r.kind==='habitEntry');
    const items=pendingHabitItems(habits,entries,todayKey());
    const sleepMissing=!all.filter((r):r is Entry<'sleep'>=>r.kind==='sleep').some(r=>!r.deletedAt&&r.data.date===todayKey());
    const choices=[...items.map(item=>item.title),...(sleepMissing?['שינה']:[])];
    return json({count:choices.length,choices});
  }catch{return json({error:'storage_unavailable'},503);}
}

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    if(typeof input.choice!=='string'||!input.choice||input.choice==='שינה')return json({error:'invalid_choice'},400);
    const today=todayKey();
    const all=await allRecords();
    const habits=all.filter((r):r is Entry<'habit'>=>r.kind==='habit');
    const entries=all.filter((r):r is Entry<'habitEntry'>=>r.kind==='habitEntry');
    const matches=pendingHabitItems(habits,entries,today).filter(item=>item.title===input.choice);
    if(matches.length!==1)return json({error:'invalid_choice'},400);
    const item=matches[0];
    const habit=habits.find(h=>h.id===item.habitId)!;
    const id='entry:'+habit.id+':'+today;
    const existing=await oneRecord(id);
    const previous=existing&&!existing.deletedAt?existing.data as HabitEntryData:undefined;
    const progress=item.stepIndex===undefined?advanceHabit(habit.data,previous):
      toggleHabitStep(previous?entryStepsDone(previous):[],item.stepIndex,habitTarget(habit.data));
    const data=validate('habitEntry',{habitId:habit.id,date:today,...progress});
    await upsert(database(),id,'habitEntry',data,existing?.version);
    return json({ok:true,choice:item.title});
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='record_conflict')return json({error:message},409);
    if(message==='request_too_large')return json({error:message},413);
    if(message==='invalid_body'||e instanceof SyntaxError)return json({error:'invalid_body'},400);
    return json({error:message||'storage_unavailable'},503);
  }
}
