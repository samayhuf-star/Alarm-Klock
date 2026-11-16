import type { Alarm } from './types';

export type Trigger =
  | { kind: 'date'; date: Date; n: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number; n: number };

export const BACKUPS = 6; // main ring + 5 follow-ups, one minute apart (iOS allows 64 pending notifications)

/** Pure: which notification triggers an alarm needs. weekday: 1=Sun..7=Sat. */
export function planTriggers(a: Alarm, now: Date = new Date()): Trigger[] {
  if (!a.enabled) return [];
  const out: Trigger[] = [];
  if (a.fireAt) {
    for (let n = 0; n < BACKUPS; n++) { const d = new Date(a.fireAt + n * 60000); if (d.getTime() > now.getTime()) out.push({ kind: 'date', date: d, n }); }
    return out;
  }
  for (let n = 0; n < BACKUPS; n++) {
    const total = a.hour * 60 + a.minute + n;
    const h = Math.floor(total / 60) % 24, m = total % 60;
    const dayShift = total >= 1440 ? 1 : 0;
    if (a.days.length === 0) {
      const d = new Date(now); d.setHours(h, m, 0, 0);
      if (dayShift) d.setDate(d.getDate() + 1);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      out.push({ kind: 'date', date: d, n });
    } else {
      for (const day of a.days) out.push({ kind: 'weekly', weekday: ((day - 1 + dayShift) % 7) + 1, hour: h, minute: m, n });
    }
  }
  return out;
}

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
