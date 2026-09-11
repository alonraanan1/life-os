import { env } from 'cloudflare:workers';
export function database(): D1Database { const db=(env as unknown as {DB?:D1Database}).DB; if(!db) throw new Error('storage_unavailable'); return db; }
export function secret(name:string):string { return (env as unknown as Record<string,string>)[name] || ''; }
export function json(data:unknown,status=200,headers:Record<string,string>={}) { return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}}); }
export function sameOrigin(request:Request) { return request.headers.get('Origin')===new URL(request.url).origin; }
export function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''); }
export async function digest(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join(''); }
export async function equal(a:string,b:string) { return (await digest(a))===(await digest(b)); }
export async function passwordHash(password:string,salt:string) { const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)),x=>x.toString(16).padStart(2,'0')).join(''); }
function cookieName(request:Request) { return new URL(request.url).protocol==='https:'?'__Host-life_session':'life_session'; }
export function sessionCookie(request:Request,token:string,age=604800) { return cookieName(request)+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+age+(new URL(request.url).protocol==='https:'?'; Secure':''); }
export async function sessionId(request:Request) { const raw=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(request)+'='))?.split('=')[1];return raw?await digest(raw):''; }
export async function authenticated(request:Request) { const id=await sessionId(request);if(!id)return false;return !!await database().prepare('SELECT id FROM life_sessions WHERE id=? AND expires_at>?').bind(id,Date.now()).first(); }
export async function limited(request:Request) { const db=database(),now=Date.now();const id=await digest('auth:'+ (request.headers.get('CF-Connecting-IP')||'local'));await db.prepare('DELETE FROM life_attempts WHERE expires_at<?').bind(now).run();const r=await db.prepare('INSERT INTO life_attempts (id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id,now+900000).first<{count:number}>();return (r?.count||0)>10; }
