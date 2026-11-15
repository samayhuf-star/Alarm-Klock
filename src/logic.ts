import type { Alarm } from './types';

export type Trigger =
  | { kind: 'date'; date: Date; n: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number; n: number };

export const BACKUPS = 4; // main ring + 3 follow-ups, one minute apart

/** Pure: which notification triggers an alarm needs. weekday: 1=Sun..7=Sat. */
export function planTriggers(a: Alarm, now: Date = new Date()): Trigger[] {
  if (!a.enabled) return [];
  const out: Trigger[] = [];
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
export const FREE_MISSIONS = ['math', 'shake', 'memory', 'typing'];
export const canUseMission = (id: string, pro: boolean) => pro || FREE_MISSIONS.includes(id);
