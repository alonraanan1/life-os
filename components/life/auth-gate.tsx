'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {LockKeyhole,LogIn} from 'lucide-react';
const reasons:Record<string,string>={state:'בקשת ההתחברות פגה. נסה שוב.',denied:'ההתחברות בוטלה.',forbidden:'החשבון הזה אינו מורשה להיכנס למרחב הזה.',config:'ההתחברות עם Google עדיין לא הוגדרה בשרת.',google:'Google לא אישרה את ההתחברות. נסה שוב.'};
export function AuthGate({children}:{children:ReactNode}) {
  const [status,setStatus]=useState<'loading'|'login'|'ready'|'error'>('loading');const [error,setError]=useState('');
  async function check(first=false){
    try{const response=await fetch('/api/auth',{cache:'no-store'});const data=await response.json() as {error?:string;authenticated?:boolean};if(!response.ok)throw new Error(data.error);if(first){const reason=new URLSearchParams(window.location.search).get('login');if(reason){setError(reasons[reason]||'ההתחברות לא הושלמה.');window.history.replaceState({},'',window.location.pathname);}}setStatus(data.authenticated?'ready':'login');}
    catch{setError('לא ניתן להתחבר לשירות כרגע.');setStatus('error');}
  }
  useEffect(()=>{
    void check(true);
    const expire=()=>{setStatus('login');setError('החיבור הסתיים. יש להתחבר שוב.');};
    window.addEventListener('life:unauthorized',expire);
    return()=>window.removeEventListener('life:unauthorized',expire);
  },[]);
  if(status==='ready')return children;
  return <main className="auth-shell" dir="rtl"><div className="auth-brand">Life OS <span>המרחב האישי שלך</span></div><section className="auth-panel"><LockKeyhole size={30}/><h1>טוב שחזרת.</h1><p>המרחב הזה פתוח רק לחשבון שלך. התחברות אחת בכל מכשיר, ואתה נשאר מחובר.</p>
  {status==='loading'?<output className="auth-loading">מתחבר…</output>:status==='error'?<button className="primary-action" onClick={()=>{setStatus('loading');void check();}}>נסה שוב</button>:<button className="google-action" onClick={()=>{window.location.assign('/api/auth/google');}}><LogIn size={18}/>התחברות עם Google</button>}
  {error&&<p role="alert" className="form-error">{error}</p>}</section></main>;
}
