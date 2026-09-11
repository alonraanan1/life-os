import {json} from '@/lib/auth';
import {validate} from '@/lib/life-model';
import {authorized,database,externalRecordId,readBody,upsert} from '@/lib/shortcuts';

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    const data=validate('task',{title:input.title,date:typeof input.date==='string'?input.date:'',time:typeof input.time==='string'?input.time:'',done:false,completedAt:''});
    const id=await externalRecordId(input.externalId);
    const created=await upsert(database(),id,'task',data,undefined);
    return json({id,created},created?201:200);
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='request_too_large')return json({error:message},413);
    if(message==='storage_unavailable')return json({error:message},503);
    return json({error:message||'invalid_request'},400);
  }
}
