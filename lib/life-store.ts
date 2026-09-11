import {database} from './auth';
import type {Entry,Kind} from './life-model';
type Row={id:string;kind:Kind;data:string;version:number;created_at:string;updated_at:string;deleted_at:string|null};
export function fromRow(r:Row):Entry{return {id:r.id,kind:r.kind,data:JSON.parse(r.data),version:r.version,createdAt:r.created_at,updatedAt:r.updated_at,deletedAt:r.deleted_at};}
export async function allRecords(){const result=await database().prepare('SELECT * FROM life_records ORDER BY updated_at DESC').all<Row>();return result.results.map(fromRow);}
export async function oneRecord(id:string){const r=await database().prepare('SELECT * FROM life_records WHERE id=?').bind(id).first<Row>();return r?fromRow(r):null;}
