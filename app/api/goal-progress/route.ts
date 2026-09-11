import {json} from '@/lib/auth';
import {validate} from '@/lib/life-model';
import {authorized,database,findByTitle,num,readBody,titlesOf,upsert} from '@/lib/shortcuts';

export async function GET(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{return json({goals:await titlesOf('goal')});}
  catch{return json({error:'storage_unavailable'},503);}
}

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const input=await readBody(request);
    const goal=await findByTitle('goal',input.title);
    if(!goal)return json({error:'goal_not_found'},404);
    const delta=num(input.delta);
    const absolute=num(input.current);
    const nextCurrent=typeof delta==='number'?goal.data.current+delta:absolute;
    const data=validate('goal',{title:goal.data.title,target:goal.data.target,unit:goal.data.unit,date:goal.data.date,current:nextCurrent});
    await upsert(database(),goal.id,'goal',data,goal.version);
    const pct=Math.min(100,Math.round(data.current/data.target*100));
    return json({ok:true,goal:data.title,current:data.current,target:data.target,pct});
  }catch(e){
    const message=e instanceof Error?e.message:'';
    if(message==='request_too_large')return json({error:message},413);
    if(message==='storage_unavailable')return json({error:message},503);
    return json({error:message||'invalid_request'},400);
  }
}
