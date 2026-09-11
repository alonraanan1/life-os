import { equal,readCookie,redirect,secret,startSession,stateCookie,stateName } from '@/lib/auth';
type Claims={aud?:string;iss?:string;exp?:number;email?:string;email_verified?:boolean};
function decodeSegment(segment:string){const base64=segment.replace(/-/g,'+').replace(/_/g,'/');const padded=base64+'='.repeat((4-base64.length%4)%4);return new TextDecoder().decode(Uint8Array.from(atob(padded),character=>character.charCodeAt(0)));}
export async function GET(request:Request){
  const url=new URL(request.url);
  const fail=(reason:string)=>redirect('/?login='+reason,[stateCookie(request,'',0)]);
  try{
    const expected=readCookie(request,stateName(request)),state=url.searchParams.get('state')||'';
    if(!expected||!state||!await equal(expected,state))return fail('state');
    const code=url.searchParams.get('code');
    if(!code)return fail('denied');
    const clientId=secret('GOOGLE_CLIENT_ID'),clientSecret=secret('GOOGLE_CLIENT_SECRET'),owner=secret('OWNER_EMAIL').trim().toLowerCase();
    if(!clientId||!clientSecret||!owner)return fail('config');
    const exchange=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:url.origin+'/api/auth/google/callback',grant_type:'authorization_code'})});
    if(!exchange.ok)return fail('google');
    const token=await exchange.json() as {id_token?:string};
    const parts=(token.id_token||'').split('.');
    if(parts.length!==3)return fail('google');
    const claims=JSON.parse(decodeSegment(parts[1])) as Claims;
    if(claims.aud!==clientId)return fail('google');
    if(claims.iss!=='accounts.google.com'&&claims.iss!=='https://accounts.google.com')return fail('google');
    if(!claims.exp||claims.exp*1000<=Date.now())return fail('google');
    if(claims.email_verified!==true||(claims.email||'').trim().toLowerCase()!==owner)return fail('forbidden');
    return redirect('/',[await startSession(request),stateCookie(request,'',0)]);
  }catch{return fail('google');}
}
