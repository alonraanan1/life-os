'use client';

import {useEffect,useState} from 'react';
import {AuthGate} from '@/components/life/auth-gate';
import {LifeProvider,useLife} from '@/components/life/use-life';
import {dataNav,navItems,viewTitles,type View} from '@/components/life/nav';
import {TodayView} from '@/components/life/today';
import {FinanceView} from '@/components/life/finance';
import {TasksView} from '@/components/life/tasks';
import {HabitsView} from '@/components/life/habits';
import {GoalsView,CheckinsView} from '@/components/life/goals';
import {SleepView} from '@/components/life/sleep';
import {TimelineView} from '@/components/life/timeline';
import {DataView} from '@/components/life/data';
import type {Entry} from '@/lib/life-model';

export default function HomePage(){return <AuthGate><LifeProvider><Dashboard/></LifeProvider></AuthGate>;}

function greetingFor(hour:number){return hour<5?'לילה טוב':hour<12?'בוקר טוב':hour<17?'צהריים טובים':hour<21?'ערב טוב':'לילה טוב';}

function Dashboard(){
  const {records,loading,error,clearError,refresh}=useLife();
  const [view,setView]=useState<View>('today');
  const [clock,setClock]=useState({date:'',greeting:''});
  const settings=records.find(record=>record.id==='settings'&&!record.deletedAt) as Entry<'settings'>|undefined;
  const name=settings?.data.name?.trim()||'';

  useEffect(()=>{
    const stamp=()=>{const now=new Date();setClock({date:new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'numeric',month:'long'}).format(now),greeting:greetingFor(now.getHours())});};
    stamp();
    const timer=window.setInterval(stamp,60000);
    return()=>window.clearInterval(timer);
  },[]);

  const go=(next:View)=>{setView(next);window.scrollTo({top:0,behavior:'smooth'});};

  useEffect(()=>{
    const context=(document as Document&{modelContext?:{registerTool?:(tool:unknown,options?:{signal?:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const life=new AbortController();
    Promise.resolve(context.registerTool({
      name:'navigate_life_os',
      title:'פתיחת אזור ב־Life OS',
      description:'Navigate to a visible Life OS area.',
      inputSchema:{type:'object',properties:{view:{type:'string',enum:[...navItems.map(item=>item.id),dataNav.id]}},required:['view'],additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute(input:unknown){const next=(input as {view:View}).view;setView(next);return {view:next,status:'visible'};},
    },{signal:life.signal})).catch(()=>{});
    return()=>life.abort();
  },[]);

  return <div dir="rtl" className="min-h-screen selection:bg-[var(--brand-tint-strong)]">
    <div className="app-shell">
      <Sidebar view={view} onNavigate={go}/>
      <main id="main-content" className="app-main">
        <AppHeader view={view} name={name} dateLabel={clock.date} greeting={clock.greeting} onProfile={()=>go('data')}/>
        {error&&<div className="app-error" role="alert"><span>{error}</span><button onClick={()=>{clearError();void refresh();}}>נסה שוב</button></div>}
        {loading?<output className="app-status">טוען את הנתונים שלך…</output>:
          view==='today'?<TodayView onNavigate={go}/>:
          view==='finance'?<FinanceView/>:
          view==='tasks'?<TasksView/>:
          view==='habits'?<HabitsView/>:
          view==='sleep'?<SleepView/>:
          view==='goals'?<GoalsView/>:
          view==='timeline'?<><CheckinsView/><TimelineView/></>:
          <DataView/>}
      </main>
      <MobileNav view={view} onNavigate={go}/>
    </div>
  </div>;
}

function Sidebar({view,onNavigate}:{view:View;onNavigate:(next:View)=>void}){
  return <aside className="app-sidebar">
    <Brand/>
    <nav className="space-y-1" aria-label="ניווט ראשי">
      {[...navItems,dataNav].map(({id,label,icon:Icon})=>
        <button key={id} onClick={()=>onNavigate(id)} aria-current={view===id?'page':undefined} className={`nav-item ${view===id?'active':''}`}><Icon/>{label}</button>)}
    </nav>
    <div className="mt-auto border-t border-[var(--stroke)] px-3 pt-5">
      <p className="text-xs font-bold text-[var(--gold)]">טיפ יומי</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">עדכון קטן בכל יום הופך את התמונה הגדולה לברורה.</p>
    </div>
  </aside>;
}

function Brand(){
  return <div className="mb-10 flex items-center gap-3 px-3">
    <div className="grid size-10 place-items-center rounded-xl bg-[var(--brand)] text-lg font-semibold text-[var(--brand-ink)]">L</div>
    <div><p className="text-lg font-semibold">Life OS</p><p className="text-xs text-[var(--text-2)]">הכל במקום אחד</p></div>
  </div>;
}

function MobileNav({view,onNavigate}:{view:View;onNavigate:(next:View)=>void}){
  return <nav className="mobile-bar" aria-label="ניווט נייד">
    {navItems.map(({id,label,icon:Icon})=>
      <button key={id} onClick={()=>onNavigate(id)} aria-current={view===id?'page':undefined} className={`mobile-nav ${view===id?'active':''}`}><span><Icon/></span>{label}</button>)}
  </nav>;
}

function AppHeader({view,name,dateLabel,greeting,onProfile}:{view:View;name:string;dateLabel:string;greeting:string;onProfile:()=>void}){
  const heading=view==='today'?[greeting,name].filter(Boolean).join(', ')||'היום':viewTitles[view];
  const initials=name?name.trim().slice(0,2):'';
  return <header className="app-header">
    <div>
      <p className="mb-1 text-xs font-semibold text-[var(--text-3)]">{dateLabel||' '}</p>
      <h1 className="page-heading">{heading}</h1>
    </div>
    <button onClick={onProfile} aria-label="הנתונים והפרופיל שלי" className="grid size-11 place-items-center rounded-full bg-[var(--surface-2)] border border-[var(--stroke)] text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]">
      {initials||<span aria-hidden="true">☰</span>}
    </button>
  </header>;
}
