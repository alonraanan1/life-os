import {json} from '@/lib/auth';
import {todayKey,validate} from '@/lib/life-model';
import {oneRecord} from '@/lib/life-store';
import {authorized,database,num,readBody,upsert} from '@/lib/shortcuts';

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    const day=typeof input.date==='string'&&input.date?input.date:todayKey();
    const data=validate('checkin',{date:day,mood:num(input.mood),note:typeof input.note==='string'?input.note:''});
    const id='checkin:'+day;
    const existing=await oneRecord(id);
    await upsert(database(),id,'checkin',data,existing?.version);
    return json({ok:true,date:day,mood:data.mood});
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='request_too_large')return json({error:message},413);
    if(message==='storage_unavailable')return json({error:message},503);
    return json({error:message||'invalid_request'},400);
  }
}
