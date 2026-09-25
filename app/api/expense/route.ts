import {database,digest,equal,json,secret} from '@/lib/auth';
import {todayKey,validate} from '@/lib/life-model';
import {num,parseBody} from '@/lib/shortcuts';

export async function POST(request:Request){
  try{
    const token=secret('APPLE_SHORTCUTS_API_KEY');
    if(!token||!await equal(request.headers.get('Authorization')||'','Bearer '+token))return json({error:'unauthorized'},401);
    const raw=await request.text();
    if(raw.length>10000)return json({error:'request_too_large'},413);
    let input:Record<string,unknown>,data,externalId:string|undefined,source:'wallet'|'bank'|undefined;
    try{
      input=parseBody(raw);
      const amount=num(input.amount);
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0)throw new Error();
      source=input.source===undefined?undefined:input.source==='wallet'||input.source==='bank'?input.source:undefined;
      if(input.source!==undefined&&!source)throw new Error();
      externalId=typeof input.externalId==='string'&&input.externalId.trim()&&input.externalId.length<=200?input.externalId.trim():undefined;
      if(source!=='wallet'&&input.externalId!==undefined&&!externalId)throw new Error();
      if(source==='bank'&&!externalId)throw new Error();
      const day=input.date===undefined?todayKey():typeof input.date==='string'?input.date.slice(0,10):'';
      const merchant=typeof input.merchant==='string'?input.merchant.trim():'';
      if(source==='bank'&&!merchant)throw new Error();
      const description=typeof input.description==='string'?input.description.trim():'';
      const category=typeof input.category==='string'?input.category.trim():'';
      const location=typeof input.location==='string'?input.location.trim():source==='wallet'?merchant:'';
      data=validate('transaction',{
        title:description||merchant||category||'חיוב ללא בית עסק',
        category:category||(source?'לבירור':''),date:day,amount:Math.round(amount*100),direction:'expense',
        funder:source==='wallet'?'dad':'me',
        ...(source?{source,location,reviewStatus:'pending'}:{}),
      });
    }catch{return json({error:'invalid_expense'},400);}
    const id=externalId?'shortcut:'+await digest(source?source+':'+externalId:externalId):crypto.randomUUID();
    const now=new Date().toISOString();
    const result=await database().prepare('INSERT OR IGNORE INTO life_records (id,kind,data,version,created_at,updated_at,deleted_at) VALUES (?,?,?,1,?,?,NULL)').bind(id,'transaction',JSON.stringify(data),now,now).run();
    return json({id,created:!!result.meta.changes,needsReview:!!source},result.meta.changes?201:200);
  }catch{return json({error:'storage_unavailable'},503);}
}
