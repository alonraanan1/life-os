import { env } from 'cloudflare:workers';
export const SESSION_AGE=34560000;
export function database(): D1Database { const db=(env as unknown as {DB?:D1Database}).DB; if(!db) throw new Error('storage_unavailable'); return db; }
export function secret(name:string):string { return (env as unknown as Record<string,string>)[name] || ''; }
export function json(data:unknown,status=200,headers:Record<string,string>={}) { return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}}); }
export function sameOrigin(request:Request) { return request.headers.get('Origin')===new URL(request.url).origin; }
export function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''); }
export async function digest(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join(''); }
export async function equal(a:string,b:string) { return (await digest(a))===(await digest(b)); }
function https(request:Request) { return new URL(request.url).protocol==='https:'; }
function cookieName(request:Request) { return https(request)?'__Host-life_session':'life_session'; }
export function stateName(request:Request) { return https(request)?'__Host-life_state':'life_state'; }
export function readCookie(request:Request,name:string) { const entry=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'=')); return entry?entry.slice(name.length+1):''; }
export function sessionCookie(request:Request,token:string,age=SESSION_AGE) { return cookieName(request)+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+(https(request)?'; Secure':''); }
export function stateCookie(request:Request,value:string,age=600) { return stateName(request)+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+(https(request)?'; Secure':''); }
export async function sessionId(request:Request) { const raw=readCookie(request,cookieName(request)); return raw?await digest(raw):''; }
export async function authenticated(request:Request) { const id=await sessionId(request);if(!id)return false;return !!await database().prepare('SELECT id FROM life_sessions WHERE id=? AND expires_at>?').bind(id,Date.now()).first(); }
export async function startSession(request:Request) { const token=randomToken();const db=database();await db.batch([db.prepare('DELETE FROM life_sessions WHERE expires_at<?').bind(Date.now()),db.prepare('INSERT INTO life_sessions (id,expires_at) VALUES (?,?)').bind(await digest(token),Date.now()+SESSION_AGE*1000)]);return sessionCookie(request,token); }
export async function renewSession(request:Request) { const raw=readCookie(request,cookieName(request));if(!raw)return '';await database().prepare('UPDATE life_sessions SET expires_at=? WHERE id=?').bind(Date.now()+SESSION_AGE*1000,await digest(raw)).run();return sessionCookie(request,raw); }
export function redirect(location:string,cookies:string[]=[]) { const headers=new Headers({Location:location,'Cache-Control':'no-store'});for(const cookie of cookies)headers.append('Set-Cookie',cookie);return new Response(null,{status:302,headers}); }
