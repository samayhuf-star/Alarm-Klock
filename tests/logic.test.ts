import { test } from 'node:test'; import assert from 'node:assert/strict';
import { planTriggers, minutesUntilNext, canAddAlarm, canUseMission, formatIn } from '../src/logic';
const base = { id: '1', hour: 7, minute: 0, label: '', enabled: true, days: [] as number[], missions: ['math'] as any, notifIds: [], gentle: true };
const at = (h: number, m: number) => { const d = new Date(2026, 10, 15, h, m, 0); return d; }; // Sun 15 Nov 2026

test('disabled alarm plans nothing', () => assert.equal(planTriggers({ ...base, enabled: false }, at(6, 0)).length, 0));
test('one-time alarm plans 6 date triggers, 1 min apart', () => {
  const t = planTriggers(base, at(6, 0)); assert.equal(t.length, 6);
  const ms = t.map((x: any) => x.date.getTime()); assert.deepEqual(ms.map((v, i) => i && v - ms[i - 1]), [0, 60000, 60000, 60000, 60000, 60000]);
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
test('repeating alarm: 6 triggers per day', () => assert.equal(planTriggers({ ...base, days: [2, 4, 6] }, at(6, 0)).length, 18));
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

import { alarmFromDuration, nextStreak, dayKey, pickSurprise, isExpiredTemp, SLEEP_PRESETS, durationLabel } from '../src/logic';
test('nap 15 min rounds up to next minute and never rings early', () => {
  const now = new Date(2026, 10, 15, 15, 26, 40); const a = alarmFromDuration('Nap', 15, now);
  assert.equal(a.hour, 15); assert.equal(a.minute, 42); assert.ok(a.fireAt! >= now.getTime() + 15 * 60000); assert.equal(a.temp, true);
});
test('deep sleep 8h from 23:30 wakes 07:30 next day', () => {
  const now = new Date(2026, 10, 15, 23, 30, 0); const a = alarmFromDuration('Deep', 480, now); const d = new Date(a.fireAt!);
  assert.equal(d.getDate(), 16); assert.equal(d.getHours(), 7); assert.equal(d.getMinutes(), 30);
});
test('timer alarm uses exact fireAt with 6 follow-ups one minute apart', () => {
  const now = new Date(2026, 10, 15, 10, 0, 0); const a = alarmFromDuration('Nap', 30, now); const t = planTriggers(a, now) as any[];
  assert.equal(t.length, 6); assert.equal(t[1].date.getTime() - t[0].date.getTime(), 60000);
});
test('expired temp alarms are detected', () => {
  const a = alarmFromDuration('Nap', 15, new Date(2026, 10, 15, 10, 0, 0));
  assert.equal(isExpiredTemp(a, new Date(2026, 10, 15, 10, 10)), false); assert.equal(isExpiredTemp(a, new Date(2026, 10, 15, 11, 0)), true);
});
test('presets cover naps and deep sleep', () => { const m = SLEEP_PRESETS.map((p) => p.minutes); assert.ok(m.includes(15) && m.includes(60) && m.includes(120) && m.includes(420) && m.includes(480)); assert.equal(durationLabel(90), '1 h 30 min'); });
test('streak continues, resets and ignores same day', () => {
  const d = new Date(2026, 10, 15); const y = new Date(2026, 10, 14);
  assert.deepEqual(nextStreak({ count: 3, last: dayKey(y) }, d), { count: 4, last: dayKey(d) });
  assert.deepEqual(nextStreak({ count: 3, last: dayKey(d) }, d), { count: 3, last: dayKey(d) });
  assert.deepEqual(nextStreak({ count: 3, last: '2026-11-01' }, d), { count: 1, last: dayKey(d) });
  assert.deepEqual(nextStreak({ count: 0, last: '' }, d), { count: 1, last: dayKey(d) });
});
test('surprise picks within pool', () => { assert.equal(pickSurprise(() => 0), 'math'); assert.equal(pickSurprise(() => 0.999), 'shake'); });
