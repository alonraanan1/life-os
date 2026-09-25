import {json} from '@/lib/auth';
import {advanceHabit,todayKey,validate,type HabitEntryData} from '@/lib/life-model';
import {oneRecord} from '@/lib/life-store';
import {authorized,database,findByTitle,readBody,titlesOf,upsert} from '@/lib/shortcuts';

export async function GET(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{return json({habits:await titlesOf('habit')});}
  catch{return json({error:'storage_unavailable'},503);}
}

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    const habit=await findByTitle('habit',input.title);
    if(!habit)return json({error:'habit_not_found'},404);
    const day=typeof input.date==='string'&&input.date?input.date:todayKey();
    const id='entry:'+habit.id+':'+day;
    const existing=await oneRecord(id);
    const previous=existing&&!existing.deletedAt?existing.data as HabitEntryData:undefined;
    // Shortcuts add one completion, capped at the target; repeated calls never
    // clear a completed day. Named steps retain their identities.
    const data=validate('habitEntry',{habitId:habit.id,date:day,...advanceHabit(habit.data,previous)});
    await upsert(database(),id,'habitEntry',data,existing?.version);
    return json({ok:true,habit:habit.data.title,date:day});
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='record_conflict')return json({error:message},409);
    if(message==='request_too_large')return json({error:message},413);
    if(message==='storage_unavailable')return json({error:message},503);
    return json({error:message||'invalid_request'},400);
  }
}
