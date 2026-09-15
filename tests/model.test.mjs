import test from 'node:test';import assert from 'node:assert/strict';import {validate,streak,scheduled,dateOffset,todayKey,calendarWeek} from '../lib/life-model.ts';
test('rejects invalid dates and fractional money',()=>{assert.throws(()=>validate('transaction',{title:'x',category:'x',date:'2026-02-30',amount:100,direction:'expense'}));assert.throws(()=>validate('transaction',{title:'x',category:'x',date:'2026-02-28',amount:1.2,direction:'expense'}));});
test('streak skips unscheduled days, allows today pending, breaks at missing scheduled day',()=>{const h={id:'h',data:{title:'x',emoji:'x',startDate:'2026-09-01',days:[0,1,2,3,4]}};const entries=['2026-09-09','2026-09-10'].map(date=>({deletedAt:null,data:{habitId:'h',date,done:true}}));assert.equal(streak(h,entries,'2026-09-13'),2);assert.equal(streak(h,entries,'2026-09-14'),0);assert.equal(scheduled(h.data,'2026-09-12'),false);});
test('calendar helpers handle month boundaries and Israel timezone',()=>{assert.equal(dateOffset('2026-03-01',-1),'2026-02-28');assert.equal(todayKey(new Date('2026-09-11T22:00:00Z')),'2026-09-12');});
test('calendarWeek always returns Sunday through Saturday',()=>{
  assert.deepEqual(calendarWeek('2026-09-13'),['2026-09-13','2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19']);
  assert.deepEqual(calendarWeek('2026-09-19'),['2026-09-13','2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19']);
  assert.deepEqual(calendarWeek('2026-01-01'),['2025-12-28','2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03']);
});
