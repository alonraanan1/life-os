// Tiny tap feedback for buttons that get pressed many times a day (habit
// marking, mostly). navigator.vibrate() covers Android/Chrome; iOS Safari has
// no vibration API at all, so we lean on the one real workaround: toggling a
// hidden <input type="checkbox" switch> (Safari 17.4+) fires the system
// haptic engine. Every step is best-effort and silent — this must never throw
// or log, and must be safe to import/call during SSR.

let switchLabel:HTMLLabelElement|null=null;

function reducedMotion():boolean{
  try{return typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
  catch{return false;}
}

// Lazily builds one hidden switch+label pair and appends it to <body> the
// first time it's needed. Kept out of the layout (position:fixed, 1px,
// opacity 0), unreachable by keyboard (tabIndex -1) and invisible to
// assistive tech (aria-hidden) — but deliberately NOT `inert`, since that can
// stop the native switch control from actually toggling, which is the whole
// trick.
function hiddenSwitch():HTMLLabelElement|null{
  try{
    if(switchLabel)return switchLabel;
    if(typeof document==='undefined'||!document.body)return null;
    const input=document.createElement('input');
    input.type='checkbox';
    input.setAttribute('switch','');
    input.tabIndex=-1;
    input.setAttribute('aria-hidden','true');
    const label=document.createElement('label');
    label.setAttribute('aria-hidden','true');
    Object.assign(label.style,{position:'fixed',top:'0',left:'0',width:'1px',height:'1px',overflow:'hidden',opacity:'0',pointerEvents:'none',zIndex:'-1'});
    label.appendChild(input);
    document.body.appendChild(label);
    switchLabel=label;
    return label;
  }catch{
    return null;
  }
}

// Fire a short (~10ms) tap. Call it directly from the press handler, before
// any async work, so it feels immediate. Does nothing on reduced-motion, and
// never throws.
export function tap():void{
  if(typeof window==='undefined')return;
  if(reducedMotion())return;
  try{
    if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'){navigator.vibrate(10);return;}
  }catch{
    // fall through to the iOS technique
  }
  const label=hiddenSwitch();
  if(!label)return;
  try{label.click();}
  catch{
    // no-op: neither mechanism is available on this platform
  }
}
