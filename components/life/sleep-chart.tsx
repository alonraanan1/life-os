'use client';
import {useEffect,useRef,useState} from 'react';
import {formatSleepDuration,type Entry} from '@/lib/life-model';

// One chart, two independently-scaled series over the same nights: a line for
// the 0-100 score (the trend) and bars for the 0-24 duration (the amount),
// so the relationship between "how long" and "how well" is visible night by
// night. Form, not colour, carries the distinction - both draw in the single
// brand accent - which keeps it readable under colour-blind vision. Neither
// series invents a value for a missing night: a night with no score breaks
// the line instead of bridging across it, and a night with no hours simply
// has no bar.
const PAD={top:14,right:34,bottom:24,left:34};
const CHART_H=176;

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
  const top=PAD.top,bottom=CHART_H-PAD.bottom;
  const scoreY=(v:number)=>top+(1-v/100)*(bottom-top);
  const hoursY=(v:number)=>top+(1-v/maxHours)*(bottom-top);

  const scoredPoints=data.map((n,i)=>({i,v:n.data.score})).filter(p=>p.v>0);
  // Break the line at any gap in the index sequence, so a night with no
  // score is never bridged with an implied value.
  const segments:{i:number;v:number}[][]=[];
  for(const p of scoredPoints){
    const open=segments[segments.length-1];
    if(open&&p.i===open[open.length-1].i+1)open.push(p);else segments.push([p]);
  }
  const path=segments.map(seg=>seg.map((p,k)=>(k?'L':'M')+xOf(p.i).toFixed(1)+' '+scoreY(p.v).toFixed(1)).join(' ')).join(' ');
  const average=scoredPoints.length?Math.round(scoredPoints.reduce((sum,p)=>sum+p.v,0)/scoredPoints.length):0;
  const barW=Math.max(4,Math.min(22,step*0.55));
  const hasScore=scoredPoints.length>0;
  const hasHours=data.some(n=>n.data.hours>0);
  const lastScored=scoredPoints[scoredPoints.length-1];

  return <div className="sleep-chart" ref={ref}>
    <p className="sleep-readout"><bdi>{shortDay(selected.data.date)}</bdi> · ציון <bdi className="num">{selected.data.score||'—'}</bdi> · <bdi className="num">{selected.data.hours?formatSleepDuration(selected.data.hours):'—'}</bdi> שעות</p>
    {width>0&&<div className="sleep-panel">
      <div className="sleep-legend">
        <span className="sleep-legend-item score"><i aria-hidden="true"/>ציון שינה (0–100){average?' · ממוצע '+average:''}</span>
        <span className="sleep-legend-item hours"><i aria-hidden="true"/>שעות שינה (0–{maxHours})</span>
      </div>
      <div className="sleep-chart-plot">
        <svg width={width} height={CHART_H} aria-label="גרף משולב של ציון ושעות שינה בלילות האחרונים"><title>ציון ושעות שינה לפי לילה</title>
          {hasScore&&[0,50,100].map(v=><line key={'g'+v} x1={PAD.left} x2={width-PAD.right} y1={scoreY(v)} y2={scoreY(v)} className="chart-grid"/>)}
          {hasHours&&[0,maxHours].map(v=><text key={'h'+v} x={PAD.left-8} y={hoursY(v)+3} className="chart-axis" textAnchor="end">{v}</text>)}
          {hasScore&&[0,50,100].map(v=><text key={'s'+v} x={width-PAD.right+8} y={scoreY(v)+3} className="chart-axis" textAnchor="start">{v}</text>)}
          {average>0&&<line x1={PAD.left} x2={width-PAD.right} y1={scoreY(average)} y2={scoreY(average)} className="chart-average"/>}
          {hasHours&&data.map((n,i)=>n.data.hours>0&&<rect key={'b'+n.id} x={xOf(i)-barW/2} y={hoursY(n.data.hours)} width={barW} height={Math.max(2,hoursY(0)-hoursY(n.data.hours))} rx={3} className={'chart-bar'+(i===(active??data.length-1)?' on':'')}/>)}
          {path&&<path d={path} className="chart-line"/>}
          {scoredPoints.map(p=><circle key={'d'+p.i} cx={xOf(p.i)} cy={scoreY(p.v)} r={p.i===(active??data.length-1)?5:4} className="chart-dot"/>)}
          {lastScored&&<text x={xOf(lastScored.i)} y={scoreY(lastScored.v)-10} className="chart-label" textAnchor="middle">{lastScored.v}</text>}
          {data.map((n,i)=>(i===0||i===data.length-1||i===Math.floor((data.length-1)/2))&&<text key={'x'+n.id} x={xOf(i)} y={CHART_H-6} className="chart-axis" textAnchor="middle">{shortDay(n.data.date)}</text>)}
        </svg>
        <div className="chart-hits" style={{paddingInlineStart:PAD.left-step/2,paddingInlineEnd:PAD.right-step/2}} onMouseLeave={()=>setActive(null)}>
          {data.map((n,i)=><button key={'hit'+n.id} type="button" style={{width:(100/data.length)+'%'}} aria-label={shortDay(n.data.date)+' ציון '+(n.data.score||'ללא')+' '+(n.data.hours||'ללא')+' שעות'} onMouseEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onClick={()=>setActive(i)}/>)}
        </div>
      </div>
    </div>}
  </div>;
}
