import type { Alarm } from './types';

export type Trigger =
  | { kind: 'date'; date: Date; n: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number; n: number };

export const BACKUPS = 6; // main ring + 5 follow-ups, one minute apart (maximum per alarm)
export const IOS_PENDING_LIMIT = 64; // iOS keeps only the 64 soonest pending local notifications
export const PENDING_BUDGET = 60; // stay under the limit, leaving headroom

/** Pure: how many notifications (main + follow-ups) each alarm may use so ALL alarms together stay under the iOS limit.
 *  A repeating alarm costs one request per selected weekday per notification; one-time alarms and sleep timers cost one. */
export function backupsPerAlarm(alarms: Alarm[]): number {
  const slots = alarms.filter((x) => x.enabled).reduce((n, x) => n + (x.fireAt || x.days.length === 0 ? 1 : x.days.length), 0);
  if (slots === 0) return BACKUPS;
  return Math.max(1, Math.min(BACKUPS, Math.floor(PENDING_BUDGET / slots)));
}

/** Pure: which notification triggers an alarm needs. weekday: 1=Sun..7=Sat. */
export function planTriggers(a: Alarm, now: Date = new Date(), backups: number = BACKUPS): Trigger[] {
  if (!a.enabled) return [];
  const out: Trigger[] = [];
  if (a.fireAt) {
    for (let n = 0; n < backups; n++) { const d = new Date(a.fireAt + n * 60000); if (d.getTime() > now.getTime()) out.push({ kind: 'date', date: d, n }); }
    return out;
  }
  // One-time alarm: decide the main ring's date ONCE, then place every follow-up exactly n minutes after it,
  // so a follow-up can never fire before (or on a different day than) the main alarm.
  let mainRing: Date | null = null;
  if (a.days.length === 0) {
    mainRing = new Date(now); mainRing.setHours(a.hour, a.minute, 0, 0);
    if (mainRing.getTime() <= now.getTime()) mainRing.setDate(mainRing.getDate() + 1);
  }
  for (let n = 0; n < backups; n++) {
    if (mainRing) { out.push({ kind: 'date', date: new Date(mainRing.getTime() + n * 60000), n }); continue; }
    const total = a.hour * 60 + a.minute + n;
    const h = Math.floor(total / 60) % 24, m = total % 60;
    const dayShift = total >= 1440 ? 1 : 0;
    for (const day of a.days) out.push({ kind: 'weekly', weekday: ((day - 1 + dayShift) % 7) + 1, hour: h, minute: m, n });
  }
  return out;
}

/** Pure: app weekdays are 1=Sun..7=Sat; AlarmKit module uses ISO 1=Mon..7=Sun. */
export const toIsoWeekday = (d: number) => (d === 1 ? 7 : d - 1);

/** Pure: minutes until the next main ring, or null if disabled. */
export function minutesUntilNext(a: Alarm, now: Date = new Date()): number | null {
  if (!a.enabled) return null;
  const t = a.hour * 60 + a.minute, nowM = now.getHours() * 60 + now.getMinutes();
  if (a.days.length === 0) return (t > nowM ? 0 : 1440) + t - nowM;
  for (let i = 0; i < 8; i++) {
    const d = ((now.getDay() + i) % 7) + 1;
    if (a.days.includes(d) && (i > 0 || t > nowM)) return i * 1440 + t - nowM;
  }
  return null;
}
export const formatIn = (mins: number | null) => (mins === null ? '' : `Rings in ${Math.floor(mins / 60)}h ${mins % 60}m`);

/** Pure: free tier limits. */
export const FREE_ALARMS = 2;
export const canAddAlarm = (count: number, pro: boolean) => pro || count < FREE_ALARMS;
export const FREE_MISSIONS = ['math', 'shake', 'memory', 'typing', 'stroop', 'surprise'];
export const canUseMission = (id: string, pro: boolean) => pro || FREE_MISSIONS.includes(id);

/** Sleep timers: one-tap temporary alarms. */
export const SLEEP_PRESETS = [
  { id: 'nap15', label: 'Quick nap', minutes: 15, emoji: '⚡' },
  { id: 'nap30', label: 'Nap', minutes: 30, emoji: '😴' },
  { id: 'nap60', label: 'Long nap', minutes: 60, emoji: '🛌' },
  { id: 'nap120', label: 'Power sleep', minutes: 120, emoji: '🌙' },
  { id: 'deep7', label: 'Deep sleep', minutes: 420, emoji: '🌌' },
  { id: 'deep8', label: 'Full night', minutes: 480, emoji: '🌠' },
];
export const durationLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);
/** Pure: wake time = now + minutes, rounded UP to the next whole minute so it never rings early. */
export function alarmFromDuration(label: string, minutes: number, now: Date = new Date()): Alarm {
  const ms = now.getTime() + minutes * 60000;
  const fireAt = Math.ceil(ms / 60000) * 60000;
  const d = new Date(fireAt);
  return { id: `sleep-${fireAt}`, hour: d.getHours(), minute: d.getMinutes(), label: `${label} · ${durationLabel(minutes)}`, enabled: true, days: [], missions: ['math'], notifIds: [], gentle: false, temp: true, fireAt };
}
/** Pure: apply an edit. A sleep timer rings at its stored fireAt, so when its time is edited fireAt is recomputed
 *  from the new hour:minute (next occurrence); other alarms are returned unchanged. */
export function applyEdit(a: Alarm, now: Date = new Date()): Alarm {
  if (!a.temp) return a;
  const d = new Date(now); d.setHours(a.hour, a.minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return { ...a, days: [], fireAt: d.getTime(), id: a.id };
}
export const isExpiredTemp = (a: Alarm, now: Date = new Date()) => !!a.temp && !!a.fireAt && a.fireAt + BACKUPS * 60000 < now.getTime();

/** Pure: streak of days with a completed wake-up. */
export type Streak = { count: number; last: string };
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function nextStreak(s: Streak, today: Date = new Date()): Streak {
  const t = dayKey(today); if (s.last === t) return s;
  const y = new Date(today); y.setDate(y.getDate() - 1);
  return { count: s.last === dayKey(y) ? s.count + 1 : 1, last: t };
}
/** Pure: pick a random mission for "Surprise me". */
export const SURPRISE_POOL = ['math', 'memory', 'stroop', 'pushups', 'squat', 'jacks', 'situps', 'shake'] as const;
export const pickSurprise = (rand: () => number = Math.random) => SURPRISE_POOL[Math.floor(rand() * SURPRISE_POOL.length)];

/** Invite codes: 6 characters, upper-case, letters and digits only. */
export const normalizeCode = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
export const inviteMessage = (code: string, url: string) =>
  `Wake up for real with Alarm Klock ⏰ Enter my code ${code} in the app within 48 hours of installing and we both get 1 month of Pro free. ${url}`;
