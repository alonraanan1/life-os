import {json} from '@/lib/auth';
import {expenseMissingFields,validate,type Entry} from '@/lib/life-model';
import {allRecords,oneRecord} from '@/lib/life-store';
import {authorized,database,num,readBody,upsert} from '@/lib/shortcuts';

export async function GET(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  try{
    const records=await allRecords();
    const items=records.filter((record):record is Entry<'transaction'>=>record.kind==='transaction'&&!record.deletedAt)
      .filter(record=>record.data.reviewStatus==='pending')
      .map(record=>({id:record.id,version:record.version,date:record.data.date,amount:record.data.amount,
        title:record.data.title,category:record.data.category,location:record.data.location||'',
        funder:record.data.funder||'me',missing:expenseMissingFields(record.data)}));
    return json({count:items.length,items});
  }catch{return json({error:'storage_unavailable'},503);}
}

export async function POST(request:Request){
  if(!await authorized(request))return json({error:'unauthorized'},401);
  let input:Record<string,unknown>;
  try{input=await readBody(request);}catch(e){return json({error:e instanceof Error&&e.message==='request_too_large'?'request_too_large':'invalid_request'},e instanceof Error&&e.message==='request_too_large'?413:400);}
  const version=num(input.version);
  if(typeof input.id!=='string'||!input.id||!Number.isInteger(version)||Number(version)<1||input.complete!==true)return json({error:'invalid_request'},400);
  try{
    const existing=await oneRecord(input.id);
    if(!existing||existing.kind!=='transaction'||existing.deletedAt)return json({error:'not_found'},404);
    const transaction=existing as Entry<'transaction'>;
    if(transaction.data.reviewStatus!=='pending')return json({error:'not_found'},404);
    if(existing.version!==version)return json({error:'record_conflict'},409);
    let data;
    try{
      data=validate('transaction',{...transaction.data,
        ...(input.description===undefined?{}:{title:input.description}),
        ...(input.category===undefined?{}:{category:input.category}),
        ...(input.location===undefined?{}:{location:input.location}),
        reviewStatus:'complete'});
    }catch{return json({error:'invalid_details'},400);}
    const missing=expenseMissingFields(data);
    if(missing.length)return json({error:'missing_details',missing},400);
    try{await upsert(database(),existing.id,'transaction',data,existing.version);}
    catch(e){if(e instanceof Error&&e.message==='record_conflict')return json({error:'record_conflict'},409);throw e;}
    return json({ok:true,id:existing.id});
  }catch{return json({error:'storage_unavailable'},503);}
}
