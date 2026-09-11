import {json} from '@/lib/auth';
import {todayKey,validate} from '@/lib/life-model';
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
    const data=validate('habitEntry',{habitId:habit.id,date:day,done:true});
    const id='entry:'+habit.id+':'+day;
    const existing=await oneRecord(id);
    await upsert(database(),id,'habitEntry',data,existing?.version);
    return json({ok:true,habit:habit.data.title,date:day});
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='request_too_large')return json({error:message},413);
    if(message==='storage_unavailable')return json({error:message},503);
    return json({error:message||'invalid_request'},400);
  }
}
