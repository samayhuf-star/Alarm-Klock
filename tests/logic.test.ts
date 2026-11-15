import { test } from 'node:test'; import assert from 'node:assert/strict';
import { planTriggers, minutesUntilNext, canAddAlarm, canUseMission, formatIn } from '../src/logic';
const base = { id: '1', hour: 7, minute: 0, label: '', enabled: true, days: [] as number[], missions: ['math'] as any, notifIds: [], gentle: true };
const at = (h: number, m: number) => { const d = new Date(2026, 10, 15, h, m, 0); return d; }; // Sun 15 Nov 2026

test('disabled alarm plans nothing', () => assert.equal(planTriggers({ ...base, enabled: false }, at(6, 0)).length, 0));
test('one-time alarm plans 4 date triggers, 1 min apart', () => {
  const t = planTriggers(base, at(6, 0)); assert.equal(t.length, 4);
  const ms = t.map((x: any) => x.date.getTime()); assert.deepEqual(ms.map((v, i) => i && v - ms[i - 1]), [0, 60000, 60000, 60000]);
});
test('one-time alarm in the past rolls to tomorrow', () => {
  const t: any = planTriggers(base, at(8, 0))[0]; assert.equal(t.date.getDate(), 16);
});
test('23:59 backups roll into next weekday', () => {
  const t: any[] = planTriggers({ ...base, hour: 23, minute: 59, days: [1] }, at(12, 0));
  assert.equal(t[0].weekday, 1); assert.equal(t[1].weekday, 2); assert.equal(t[1].hour, 0); assert.equal(t[1].minute, 0);
});
test('Saturday 23:59 backup wraps to Sunday', () => {
  const t: any[] = planTriggers({ ...base, hour: 23, minute: 59, days: [7] }, at(12, 0)); assert.equal(t[1].weekday, 1);
});
test('repeating alarm: 4 triggers per day', () => assert.equal(planTriggers({ ...base, days: [2, 4, 6] }, at(6, 0)).length, 12));
test('minutesUntilNext today and tomorrow', () => {
  assert.equal(minutesUntilNext(base, at(6, 0)), 60); assert.equal(minutesUntilNext(base, at(8, 0)), 23 * 60);
});
test('repeating alarm skips to next selected weekday', () => {
  assert.equal(minutesUntilNext({ ...base, days: [2] }, at(8, 0)), 23 * 60); // Sunday->Monday 07:00
  assert.equal(minutesUntilNext({ ...base, days: [1] }, at(8, 0)), 6 * 1440 + (7 - 8) * 60 + 1440); // next Sunday
});
test('disabled returns null / empty label', () => { assert.equal(minutesUntilNext({ ...base, enabled: false }), null); assert.equal(formatIn(null), ''); });
test('free tier limits', () => {
  assert.equal(canAddAlarm(1, false), true); assert.equal(canAddAlarm(2, false), false); assert.equal(canAddAlarm(9, true), true);
  assert.equal(canUseMission('math', false), true); assert.equal(canUseMission('qr', false), false); assert.equal(canUseMission('qr', true), true);
});
