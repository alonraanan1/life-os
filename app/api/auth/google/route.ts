import { json,randomToken,redirect,secret,stateCookie } from '@/lib/auth';
export async function GET(request:Request){
  const clientId=secret('GOOGLE_CLIENT_ID');
  if(!clientId||!secret('GOOGLE_CLIENT_SECRET')||!secret('OWNER_EMAIL'))return json({error:'ההתחברות עם Google עדיין לא הוגדרה בשרת.'},503);
  const state=randomToken();
  const authorize=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorize.searchParams.set('client_id',clientId);
  authorize.searchParams.set('redirect_uri',new URL(request.url).origin+'/api/auth/google/callback');
  authorize.searchParams.set('response_type','code');
  authorize.searchParams.set('scope','openid email');
  authorize.searchParams.set('state',state);
  authorize.searchParams.set('prompt','select_account');
  return redirect(authorize.toString(),[stateCookie(request,state)]);
}
