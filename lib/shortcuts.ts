import {database,digest,equal,secret} from './auth';
import {allRecords} from './life-store';
import type {Entry} from './life-model';

export async function authorized(request:Request):Promise<boolean>{
  const token=secret('APPLE_SHORTCUTS_API_KEY');
  if(!token)return false;
  return equal(request.headers.get('Authorization')||'','Bearer '+token);
}

export async function readBody(request:Request,maxLen=10000):Promise<Record<string,unknown>>{
  const raw=await request.text();
  if(raw.length>maxLen)throw new Error('request_too_large');
  const input=JSON.parse(raw);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('invalid_body');
  return input as Record<string,unknown>;
}

export function externalRecordId(externalId:unknown):Promise<string>|string{
  if(externalId===undefined)return crypto.randomUUID();
  if(typeof externalId!=='string'||externalId.length>200)throw new Error('invalid_external_id');
  return digest(externalId).then(hash=>'shortcut:'+hash);
}

export async function findByTitle<K extends 'habit'|'goal'>(kind:K,title:unknown):Promise<Entry<K>|undefined>{
  if(typeof title!=='string'||!title.trim())throw new Error('invalid_title');
  const wanted=title.trim().toLowerCase();
  const records=await allRecords();
  return records.find(r=>r.kind===kind&&!r.deletedAt&&(r.data as {title:string}).title.trim().toLowerCase()===wanted) as Entry<K>|undefined;
}

export async function titlesOf<K extends 'habit'|'goal'>(kind:K):Promise<string[]>{
  const records=await allRecords();
  return records.filter(r=>r.kind===kind&&!r.deletedAt).map(r=>(r.data as {title:string}).title);
}

export async function upsert(db:D1Database,id:string,kind:string,data:unknown,existingVersion:number|undefined):Promise<boolean>{
  const now=new Date().toISOString();
  const result=existingVersion===undefined
    ?await db.prepare('INSERT OR IGNORE INTO life_records (id,kind,data,version,created_at,updated_at,deleted_at) VALUES (?,?,?,1,?,?,NULL)').bind(id,kind,JSON.stringify(data),now,now).run()
    :await db.prepare('UPDATE life_records SET data=?,version=version+1,updated_at=?,deleted_at=NULL WHERE id=? AND version=?').bind(JSON.stringify(data),now,id,existingVersion).run();
  return !!result.meta.changes;
}

export {database};
