import test from 'node:test';import assert from 'node:assert/strict';import {validate,streak,scheduled,dateOffset,todayKey,calendarWeek,effectiveFunder,effectiveCategory,DAD_CATEGORY,entryCount,entryStepsDone,habitTarget,toggleHabitStep,toggleHabitPill,sleepParts,sleepHoursFromParts,formatSleepDuration,expenseMissingFields,pendingHabitItems,perfectStreaks,budgetStreak,money,dadDebt,settleEntry,dayMonth,advanceHabit,budgetFor,byCreated,fixedCopies} from '../lib/life-model.ts';
test('charging reminder lists only unfinished habits scheduled today, with remaining steps',()=>{
  const day='2026-09-25';
  const habit=(id,title,extra={})=>({id,kind:'habit',deletedAt:null,createdAt:'2026-09-01T00:00:00.000Z',data:{title,emoji:'x',startDate:'2026-09-01',days:[0,1,2,3,4,5,6],...extra}});
  const entry=(habitId,done,count,stepsDone)=>({kind:'habitEntry',deletedAt:null,data:{habitId,date:day,done,count,stepsDone}});
  const habits=[habit('a','מים',{target:3}),habit('b','ויטמינים',{steps:['מגנזיום','אבץ','תוסף']}),habit('c','בוצע'),habit('d','לא היום',{days:[0]})];
  assert.deepEqual(pendingHabitItems(habits,[entry('a',false,1),entry('b',false,1,[1]),entry('c',true,1)],day),[
    {title:'מים — נשארו 2 מתוך 3',habitId:'a'},
    {title:'ויטמינים: מגנזיום',habitId:'b',stepIndex:0},
    {title:'ויטמינים: תוסף',habitId:'b',stepIndex:2},
  ]);
  assert.deepEqual(pendingHabitItems(habits,[entry('a',true,3),entry('b',true,3,[0,1,2]),entry('c',true,1)],day),[]);
});
test('sleep duration uses real minutes and rejects 80 minutes',()=>{
  assert.deepEqual(sleepParts(6.8),{hours:6,minutes:48});
  assert.equal(formatSleepDuration(6.8),'6:48');
  assert.equal(sleepHoursFromParts(6,48),6.8);
  assert.throws(()=>sleepHoursFromParts(6,80));
  assert.throws(()=>sleepHoursFromParts(24,1));
});
test('rejects invalid dates and fractional money',()=>{assert.throws(()=>validate('transaction',{title:'x',category:'x',date:'2026-02-30',amount:100,direction:'expense'}));assert.throws(()=>validate('transaction',{title:'x',category:'x',date:'2026-02-28',amount:1.2,direction:'expense'}));});
test('streak skips unscheduled days, allows today pending, breaks at missing scheduled day',()=>{const h={id:'h',data:{title:'x',emoji:'x',startDate:'2026-09-01',days:[0,1,2,3,4]}};const entries=['2026-09-09','2026-09-10'].map(date=>({deletedAt:null,data:{habitId:'h',date,done:true}}));assert.equal(streak(h,entries,'2026-09-13'),2);assert.equal(streak(h,entries,'2026-09-14'),0);assert.equal(scheduled(h.data,'2026-09-12'),false);});
test('calendar helpers handle month boundaries and Israel timezone',()=>{assert.equal(dateOffset('2026-03-01',-1),'2026-02-28');assert.equal(todayKey(new Date('2026-09-11T22:00:00Z')),'2026-09-12');});
test('calendarWeek always returns Sunday through Saturday',()=>{
  assert.deepEqual(calendarWeek('2026-09-13'),['2026-09-13','2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19']);
  assert.deepEqual(calendarWeek('2026-09-19'),['2026-09-13','2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19']);
  assert.deepEqual(calendarWeek('2026-01-01'),['2025-12-28','2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03']);
});
test('legacy DAD_CATEGORY rows read as dad-funded with category אחר',()=>{const t={title:'x',category:DAD_CATEGORY,date:'2026-09-01',amount:100,direction:'expense'};assert.equal(effectiveFunder(t),'dad');assert.equal(effectiveCategory(t),'אחר');});
test('a row with an explicit funder and a real category keeps that category',()=>{const t={title:'x',category:'אוכל',date:'2026-09-01',amount:100,direction:'expense',funder:'dad'};assert.equal(effectiveFunder(t),'dad');assert.equal(effectiveCategory(t),'אוכל');});
test('a plain old row with no funder reads as me',()=>{const t={title:'x',category:'אוכל',date:'2026-09-01',amount:100,direction:'expense'};assert.equal(effectiveFunder(t),'me');assert.equal(effectiveCategory(t),'אוכל');});
test('validation rejects a bogus funder value by defaulting it to me',()=>{const r=validate('transaction',{title:'x',category:'אוכל',date:'2026-09-01',amount:100,direction:'expense',funder:'grandpa'});assert.equal(r.funder,'me');});
test('transaction validation preserves location and review state while old records stay compatible',()=>{
  const base={title:'בית קפה',category:'לבירור',date:'2026-09-01',amount:1290,direction:'expense',funder:'dad'};
  assert.deepEqual(validate('transaction',{...base,location:'תל אביב',reviewStatus:'pending'}),{...base,location:'תל אביב',reviewStatus:'pending'});
  assert.equal(validate('transaction',base).reviewStatus,undefined);
  assert.throws(()=>validate('transaction',{...base,reviewStatus:'approved'}));
});
test('dad charges require a place while personal charges can complete without one',()=>{
  const base={title:'בית קפה',category:'אוכל',date:'2026-09-01',amount:1290,direction:'expense'};
  assert.deepEqual(expenseMissingFields({...base,funder:'dad',location:''}),['location']);
  assert.deepEqual(expenseMissingFields({...base,funder:'me',location:''}),[]);
  assert.deepEqual(expenseMissingFields({...base,funder:'dad',location:'תל אביב',category:'לבירור'}),['category']);
});
test('habit target validation accepts 3 and rejects 0, 11 and non-integers',()=>{const base={title:'x',emoji:'x',startDate:'2026-09-01',days:[0]};assert.equal(validate('habit',{...base,target:3}).target,3);assert.throws(()=>validate('habit',{...base,target:0}));assert.throws(()=>validate('habit',{...base,target:11}));assert.throws(()=>validate('habit',{...base,target:2.5}));});
test('habit entry count validation accepts a valid count',()=>{const r=validate('habitEntry',{habitId:'h',date:'2026-09-01',done:false,count:2});assert.equal(r.count,2);});
test('entryCount maps a legacy entry with no count from the done boolean',()=>{assert.equal(entryCount({habitId:'h',date:'2026-09-01',done:true}),1);assert.equal(entryCount({habitId:'h',date:'2026-09-01',done:false}),0);});
test('a partial day breaks the streak like an unmarked day, but a partial today does not break it early',()=>{
  const h={id:'h',data:{title:'x',emoji:'x',startDate:'2026-09-01',days:[0,1,2,3,4],target:3}};
  const entries=[
    {deletedAt:null,data:{habitId:'h',date:'2026-09-08',done:true,count:3}},
    {deletedAt:null,data:{habitId:'h',date:'2026-09-09',done:true,count:3}},
    {deletedAt:null,data:{habitId:'h',date:'2026-09-10',done:false,count:2}},
  ];
  assert.equal(streak(h,entries,'2026-09-10'),2);
  assert.equal(streak(h,entries,'2026-09-13'),0);
});
test('habit steps validation accepts three names and rejects one name, seven names, duplicates and an over-long name',()=>{
  const base={title:'x',emoji:'x',startDate:'2026-09-01',days:[0]};
  assert.deepEqual(validate('habit',{...base,steps:['קריאטין','מגנזיום','תוסף']}).steps,['קריאטין','מגנזיום','תוסף']);
  assert.throws(()=>validate('habit',{...base,steps:['רק אחד']}));
  assert.throws(()=>validate('habit',{...base,steps:['א','ב','ג','ד','ה','ו','ז']}));
  assert.throws(()=>validate('habit',{...base,steps:['שם','שם']}));
  assert.throws(()=>validate('habit',{...base,steps:['שם','א'.repeat(31)]}));
});
test('habitTarget returns steps.length when steps exist, ignoring a conflicting stored target',()=>{
  assert.equal(habitTarget({title:'x',emoji:'x',startDate:'2026-09-01',days:[0],target:9,steps:['א','ב','ג']}),3);
  assert.equal(habitTarget({title:'x',emoji:'x',startDate:'2026-09-01',days:[0],target:5}),5);
  assert.equal(habitTarget({title:'x',emoji:'x',startDate:'2026-09-01',days:[0]}),1);
});
test('an entry records the right count and done for one, two and three completed steps',()=>{
  let r=toggleHabitStep([],0,3);assert.deepEqual(r,{stepsDone:[0],count:1,done:false});
  r=toggleHabitStep(r.stepsDone,1,3);assert.deepEqual(r,{stepsDone:[0,1],count:2,done:false});
  r=toggleHabitStep(r.stepsDone,2,3);assert.deepEqual(r,{stepsDone:[0,1,2],count:3,done:true});
});
test('a legacy entry with count and no stepsDone still reads correctly',()=>{
  assert.deepEqual(entryStepsDone({habitId:'h',date:'2026-09-01',done:false,count:2}),[0,1]);
  assert.deepEqual(entryStepsDone({habitId:'h',date:'2026-09-01',done:true}),[0]);
});
test('an entry referencing a step index that no longer exists does not throw',()=>{
  assert.deepEqual(entryStepsDone({habitId:'h',date:'2026-09-01',done:false,count:1,stepsDone:[4]}),[4]);
  const data=validate('habitEntry',{habitId:'h',date:'2026-09-01',done:false,count:1,stepsDone:[4]});
  assert.deepEqual(data.stepsDone,[4]);
});
test('the mark pill on a stepped habit marks the next unmarked step in order, then clears every step once complete',()=>{
  let r=toggleHabitPill([],3);assert.deepEqual(r,{stepsDone:[0],count:1,done:false});
  r=toggleHabitPill(r.stepsDone,3);assert.deepEqual(r,{stepsDone:[0,1],count:2,done:false});
  r=toggleHabitPill(r.stepsDone,3);assert.deepEqual(r,{stepsDone:[0,1,2],count:3,done:true});
  r=toggleHabitPill(r.stepsDone,3);assert.deepEqual(r,{stepsDone:[],count:0,done:false});
});
test('the mark pill fills gaps left by individually-unmarked steps before advancing past the target',()=>{
  // 0 and 2 done, 1 still open: the pill must mark 1 next, not push past target.
  assert.deepEqual(toggleHabitPill([0,2],3),{stepsDone:[0,1,2],count:3,done:true});
});
test('perfect days need every due habit done; empty days skip, a pending today does not break the run',()=>{
  const habit=(id,days=[0,1,2,3,4,5,6])=>({id,kind:'habit',deletedAt:null,data:{title:id,emoji:'x',startDate:'2026-09-01',days}});
  const done=(habitId,...dates)=>dates.map(date=>({kind:'habitEntry',deletedAt:null,data:{habitId,date,done:true}}));
  // 19–21 perfect (best 3), 22 only a (break), 23–24 perfect, 25 still pending.
  const entries=[...done('a','2026-09-19','2026-09-20','2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25'),...done('b','2026-09-19','2026-09-20','2026-09-21','2026-09-23','2026-09-24')];
  assert.deepEqual(perfectStreaks([habit('a'),habit('b')],entries,'2026-09-25'),{current:2,best:3});
  // Sun–Thu habit: Thursday 17 and Sunday 20 are consecutive, Fri/Sat are skipped.
  assert.deepEqual(perfectStreaks([habit('c',[0,1,2,3,4])],done('c','2026-09-17','2026-09-20'),'2026-09-20'),{current:2,best:2});
  assert.deepEqual(perfectStreaks([],[],'2026-09-25'),{current:0,best:0});
});
test('the budget streak counts days in a row within the pro-rata monthly budget',()=>{
  const t=(date,amount,direction='expense')=>({title:'x',category:'x',date,amount,direction});
  assert.equal(budgetStreak([],30000,'2026-09-25'),25);
  // 150 ₪ on the 1st of a 300 ₪ / 30-day month is back within pace from the 15th.
  assert.equal(budgetStreak([t('2026-09-01',15000)],30000,'2026-09-25'),11);
  assert.equal(budgetStreak([t('2026-09-25',1000000)],30000,'2026-09-25'),0);
  assert.equal(budgetStreak([],0,'2026-09-25'),0);
  assert.equal(budgetStreak([t('2026-09-10',99999,'income'),t('2026-08-31',99999)],30000,'2026-09-25'),25);
});
test('a signed amount lets Intl keep the sign beside the digits in RTL',()=>{
  assert.match(money(5000,true),/\u200e\+/);
  assert.match(money(-5000,true),/\u200e-/);
  assert.doesNotMatch(money(5000),/\+/);
});
test('a payment to dad settles the oldest charges first and never counts as spending',()=>{
  const dad=(date,amount)=>({title:'x',category:'אחר',date,amount,direction:'expense',funder:'dad'});
  const charges=[dad('2026-07-10',4000),dad('2026-09-02',1500),dad('2026-09-22',1000),{...dad('2026-09-05',900),funder:'me'},{...dad('2026-09-06',700),direction:'income'}];
  assert.deepEqual(dadDebt(charges,[],'2026-09'),{open:6500,month:2500});
  assert.deepEqual(dadDebt(charges,[{date:'2026-09-01',amount:2000}],'2026-09'),{open:4500,month:2500});
  // Once July is paid off, the rest of the payment comes out of September.
  assert.deepEqual(dadDebt(charges,[{date:'2026-09-25',amount:5000}],'2026-09'),{open:1500,month:1500});
  assert.deepEqual(dadDebt(charges,[{date:'2026-09-25',amount:5000}],'2026-07'),{open:1500,month:0});
  assert.deepEqual(dadDebt(charges,[{date:'2026-09-25',amount:9000}],'2026-09'),{open:0,month:0});
  assert.deepEqual(validate('dadPayment',{date:'2026-09-25',amount:5000,extra:1}),{date:'2026-09-25',amount:5000});
  assert.throws(()=>validate('dadPayment',{date:'2026-09-25',amount:0}));
  assert.throws(()=>validate('dadPayment',{date:'2026-09-25',amount:12.5}));
});
test('the server settles done from the habit target, not from what the screen sent',()=>{
  const plain={title:'x',emoji:'x',days:[0],startDate:'2026-09-01',target:3},stepped={...plain,steps:['a','b'],target:2};
  const day={habitId:'h',date:'2026-09-20'};
  assert.equal(settleEntry(plain,{...day,done:true,count:2}).done,false);
  assert.equal(settleEntry(plain,{...day,done:false,count:3}).done,true);
  assert.deepEqual(settleEntry(stepped,{...day,done:false,count:0,stepsDone:[0,1]}),{...day,done:true,count:2,stepsDone:[0,1]});
  // A legacy mark with no count stays exactly as sent.
  assert.deepEqual(settleEntry(plain,{...day,done:true}),{...day,done:true});
});
test('short dates read day first, with a two-digit year when asked',()=>{
  assert.equal(dayMonth('2026-09-05'),'05/09');
  assert.equal(dayMonth('2026-09-25T10:00:00.000Z',true),'25/09/26');
});
test('a step removed from the habit no longer counts toward the day',()=>{
  // Steps 0, 1 and the since-deleted 3 were done; the habit now has 3 steps.
  assert.deepEqual(toggleHabitStep([0,1,3],2,3),{stepsDone:[0,1,2],count:3,done:true});
  assert.deepEqual(toggleHabitStep([0,1,3],0,3),{stepsDone:[1],count:1,done:false});
  assert.deepEqual(toggleHabitPill([0,1,3],3),{stepsDone:[0,1,2],count:3,done:true});
  const stepped={title:'x',emoji:'x',days:[0],startDate:'2026-09-01',steps:['a','b','c']},day={habitId:'h',date:'2026-09-20'};
  assert.deepEqual(settleEntry(stepped,{...day,done:true,count:3,stepsDone:[0,1,3]}),{...day,done:false,count:2,stepsDone:[0,1]});
  assert.deepEqual(advanceHabit(stepped,{...day,done:true,count:3,stepsDone:[0,1,3]}),{stepsDone:[0,1,2],count:3,done:true});
});
test('a budget carries forward until a later month sets its own, and an explicit 0 carries too',()=>{
  const b=(month,amount)=>({month,amount});
  assert.equal(budgetFor([],'2026-10'),0);
  assert.equal(budgetFor([b('2026-08',300000),b('2026-09',500000)],'2026-11'),500000);
  assert.equal(budgetFor([b('2026-09',500000),b('2026-10',400000)],'2026-10'),400000);
  assert.equal(budgetFor([b('2026-09',500000)],'2026-08'),0);
  assert.equal(budgetFor([b('2026-09',500000),b('2026-10',0)],'2026-12'),0);
});
test('habits keep their creation order, whatever order they are listed in',()=>{
  const h=(id,createdAt)=>({id,kind:'habit',deletedAt:null,createdAt,data:{title:id,emoji:'x',startDate:'2026-09-01',days:[0,1,2,3,4,5,6]}});
  // Listed newest update first, the way the server and the store return them.
  const listed=[h('c','2026-09-03T00:00:00.000Z'),h('b','2026-09-01T00:00:00.000Z'),h('a','2026-09-01T00:00:00.000Z')];
  assert.deepEqual([...listed].sort(byCreated).map(x=>x.id),['a','b','c']);
  assert.deepEqual(pendingHabitItems(listed,[],'2026-09-26').map(x=>x.habitId),['a','b','c']);
});
test('a fixed expense offers one copy a month, built on its latest earlier occurrence',()=>{
  const tx=(id,date,extra={})=>({id,kind:'transaction',deletedAt:null,createdAt:date,data:{title:'שכר דירה',category:'בית',date,amount:450000,direction:'expense',funder:'me',recurring:true,...extra}});
  const rent=tx('rent','2026-01-31',{reviewStatus:'complete',source:'bank'});
  // Same day next month, capped at its length; review state and source stay behind.
  assert.deepEqual(fixedCopies([rent],'2026-02'),[{id:'rent:2026-02',data:{title:'שכר דירה',category:'בית',date:'2026-02-28',amount:450000,direction:'expense',funder:'me',recurring:true}}]);
  assert.deepEqual(fixedCopies([rent],'2026-01'),[]);
  const feb=tx('rent:2026-02','2026-02-28',{amount:460000});
  assert.deepEqual(fixedCopies([rent,feb],'2026-02'),[]);
  assert.deepEqual(fixedCopies([rent,{...feb,deletedAt:'2026-02-28'}],'2026-02'),[]);
  assert.deepEqual(fixedCopies([rent,feb],'2026-03').map(c=>[c.id,c.data.amount]),[['rent:2026-03',460000]]);
  // Switched off on the latest occurrence, the series stops.
  assert.deepEqual(fixedCopies([rent,{...feb,data:{...feb.data,recurring:undefined}}],'2026-03'),[]);
});
test('fixed expenses come off the budget before the daily pace',()=>{
  const rent={title:'שכר דירה',category:'בית',date:'2026-09-01',amount:500000,direction:'expense',recurring:true};
  const coffee={title:'קפה',category:'אוכל',date:'2026-09-02',amount:10000,direction:'expense'};
  assert.equal(budgetStreak([rent,coffee],1000000,'2026-09-03'),3);
  assert.equal(budgetStreak([{...rent,recurring:undefined},coffee],1000000,'2026-09-03'),0);
  assert.equal(budgetStreak([{...rent,amount:1000000}],1000000,'2026-09-03'),0);
});
test('only true marks a transaction as fixed',()=>{
  const base={title:'חדר כושר',category:'בריאות',date:'2026-09-01',amount:19900,direction:'expense'};
  assert.equal(validate('transaction',{...base,recurring:true}).recurring,true);
  assert.equal('recurring' in validate('transaction',base),false);
  assert.throws(()=>validate('transaction',{...base,recurring:'yes'}));
});
