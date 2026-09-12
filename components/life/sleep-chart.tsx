'use client';
import {useEffect,useRef,useState} from 'react';
import type {Entry} from '@/lib/life-model';

// Score (0-100) and hours (0-24) are different scales, so they never share an
// axis — they are two stacked panels over the same nights, told apart by their
// titles and by form (a line for the trend, bars for the nightly amount)
// rather than by colour, which keeps them readable for colour-blind viewers.
const PAD={top:12,right:10,bottom:20,left:30};

function useWidth(){
  const ref=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(0);
  useEffect(()=>{
    const el=ref.current;
    if(!el)return;
    const observer=new ResizeObserver(entries=>{const next=entries[0]?.contentRect.width;if(next)setWidth(Math.round(next));});
    observer.observe(el);
    return()=>observer.disconnect();
  },[]);
  return [ref,width] as const;
}

function shortDay(date:string){return new Date(date+'T12:00:00Z').toLocaleDateString('he-IL',{day:'numeric',month:'numeric'});}

export function SleepChart({nights}:{nights:Entry<'sleep'>[]}){
  const [ref,width]=useWidth();
  const [active,setActive]=useState<number|null>(null);
  const data=[...nights].sort((a,b)=>a.data.date.localeCompare(b.data.date)).slice(-14);
  if(data.length<2)return null;
  const selected=data[active??data.length-1];
  const maxHours=Math.max(9,Math.ceil(Math.max(...data.map(n=>n.data.hours))));
  const plot=Math.max(0,width-PAD.left-PAD.right);
  const step=data.length>1?plot/(data.length-1):0;
  const xOf=(i:number)=>PAD.left+step*i;

  const scoreH=104,hoursH=84;
  const scoreY=(v:number)=>PAD.top+(1-v/100)*(scoreH-PAD.top-PAD.bottom);
  const hoursY=(v:number)=>PAD.top+(1-v/maxHours)*(hoursH-PAD.top-PAD.bottom);
  const scored=data.map((n,i)=>({i,v:n.data.score})).filter(p=>p.v>0);
  const path=scored.map((p,k)=>(k?'L':'M')+xOf(p.i).toFixed(1)+' '+scoreY(p.v).toFixed(1)).join(' ');
  const average=scored.length?Math.round(scored.reduce((sum,p)=>sum+p.v,0)/scored.length):0;
  const barW=Math.max(4,Math.min(22,step*0.55));

  return <div className="sleep-chart" ref={ref}>
    <p className="sleep-readout"><bdi>{shortDay(selected.data.date)}</bdi> · ציון <bdi className="num">{selected.data.score||'—'}</bdi> · <bdi className="num">{selected.data.hours||'—'}</bdi> שעות</p>
    {width>0&&<>
      <div className="sleep-panel"><span className="sleep-panel-title">ציון שינה{average?' · ממוצע '+average:''}</span>
        <svg width={width} height={scoreH}><title>גרף ציון שינה לפי לילה</title>
          {[0,50,100].map(v=><line key={v} x1={PAD.left} x2={width-PAD.right} y1={scoreY(v)} y2={scoreY(v)} className="chart-grid"/>)}
          {[0,50,100].map(v=><text key={v} x={PAD.left-6} y={scoreY(v)+3} className="chart-axis" textAnchor="end">{v}</text>)}
          {average>0&&<line x1={PAD.left} x2={width-PAD.right} y1={scoreY(average)} y2={scoreY(average)} className="chart-average"/>}
          {path&&<path d={path} className="chart-line"/>}
          {scored.map(p=><circle key={p.i} cx={xOf(p.i)} cy={scoreY(p.v)} r={p.i===(active??data.length-1)?5:4} className="chart-dot"/>)}
          {scored.length>0&&<text x={xOf(scored[scored.length-1].i)} y={scoreY(scored[scored.length-1].v)-10} className="chart-label" textAnchor="middle">{scored[scored.length-1].v}</text>}
        </svg>
      </div>
      <div className="sleep-panel"><span className="sleep-panel-title">שעות שינה</span>
        <svg width={width} height={hoursH}><title>גרף שעות שינה לפי לילה</title>
          {[0,maxHours].map(v=><line key={v} x1={PAD.left} x2={width-PAD.right} y1={hoursY(v)} y2={hoursY(v)} className="chart-grid"/>)}
          {[0,maxHours].map(v=><text key={v} x={PAD.left-6} y={hoursY(v)+3} className="chart-axis" textAnchor="end">{v}</text>)}
          {data.map((n,i)=>n.data.hours>0&&<rect key={n.id} x={xOf(i)-barW/2} y={hoursY(n.data.hours)} width={barW} height={Math.max(2,hoursY(0)-hoursY(n.data.hours))} rx={3} className={'chart-bar'+(i===(active??data.length-1)?' on':'')}/>)}
          {data.map((n,i)=>(i===0||i===data.length-1||i===Math.floor((data.length-1)/2))&&<text key={'x'+n.id} x={xOf(i)} y={hoursH-5} className="chart-axis" textAnchor="middle">{shortDay(n.data.date)}</text>)}
        </svg>
      </div>
      <div className="chart-hits" style={{paddingInlineStart:PAD.left-step/2,paddingInlineEnd:PAD.right-step/2}} onMouseLeave={()=>setActive(null)}>
        {data.map((n,i)=><button key={'hit'+n.id} type="button" style={{width:(100/data.length)+'%'}} aria-label={shortDay(n.data.date)+' ציון '+(n.data.score||'ללא')+' '+(n.data.hours||'ללא')+' שעות'} onMouseEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onClick={()=>setActive(i)}/>)}
      </div>
    </>}
  </div>;
}
