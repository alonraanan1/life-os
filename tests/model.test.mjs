import test from 'node:test';import assert from 'node:assert/strict';import {validate,streak,scheduled,dateOffset,todayKey,calendarWeek,effectiveFunder,effectiveCategory,DAD_CATEGORY,entryCount} from '../lib/life-model.ts';
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
