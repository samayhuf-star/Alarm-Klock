// Native system alarms (Apple AlarmKit, iOS 26+). They ring on the lock screen, through silent mode and Focus,
// even when the app is closed. On older iOS (or if permission is refused) the app falls back to local notifications.
import { Platform } from 'react-native';
import { Alarm } from './types';
import { soundFile } from './sounds';
import { planTriggers, toIsoWeekday } from './logic';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module, must be loaded lazily
const mod = () => { try { return require('react-native-alarm-scheduler').default as typeof import('react-native-alarm-scheduler').default; } catch { return null; } };
export const nativeSupported = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

let authorized: boolean | null = null;
export async function nativeReady(): Promise<boolean> {
  if (!nativeSupported) return false;
  if (authorized !== null) return authorized;
  try { const m = mod(); if (!m) return (authorized = false); const p = await m.requestPermissionsAsync(); authorized = p.status === 'authorized'; } catch { authorized = false; }
  return authorized;
}

/** Schedule the alarm natively. Returns true when AlarmKit owns it (no notification backups are then needed). */
export async function scheduleNative(a: Alarm): Promise<boolean> {
  try {
    const m = mod(); if (!m || !(await nativeReady())) return false;
    await m.cancelAlarmAsync(a.id).catch(() => {});
    if (!a.enabled) return true;
    const input: any = {
      id: a.id, hour: a.hour, minute: a.minute, title: a.label || 'Wake up!',
      ios: { alertTitle: a.label || 'Wake up!', alertActionMode: 'openAppOnly', stopIntentBehavior: 'rescheduleImmediate', secondaryButtonBehavior: 'openApp',
        secondaryButtonTitle: 'Open Alarm Klock', metadata: { alarmId: a.id }, soundName: soundFile(a.sound, a.gentle) },
    };
    if (a.days.length > 0) input.weekdays = a.days.map(toIsoWeekday).sort();
    else { const t = planTriggers(a, new Date(), 1)[0]; if (!t || t.kind !== 'date') return false; input.timestamp = t.date.getTime(); input.hour = t.date.getHours(); input.minute = t.date.getMinutes(); }
    await m.scheduleAlarmAsync(input);
    return true;
  } catch { return false; }
}
export async function cancelNative(id: string) { try { await mod()?.cancelAlarmAsync(id); } catch {} }
/** Call once the user has finished every mission: ends the native ring. */
export async function completeNative(id: string) { try { if (nativeSupported) await mod()?.completeNativeAlarmAsync(id); } catch {} }
/** While the user works through missions in the app, keep the native ring quiet / push its backup out. */
export async function holdNative(id: string, seconds = 45) { try { if (nativeSupported) await mod()?.holdRingAsync(id, { seconds }); } catch {} }
/** Which alarm (if any) opened the app from a native ring? Reconcile on launch and every foreground. */
export async function pendingNativeAlarmId(): Promise<string | null> {
  try {
    const m = nativeSupported ? mod() : null; if (!m) return null;
    const h = await m.getPendingNativeAlarmHandoffAsync();
    const id = h?.alarmId ?? (await m.getCurrentAlarmContextAsync())?.id ?? null;
    if (h) await m.clearPendingNativeAlarmHandoffAsync();
    return id;
  } catch { return null; }
}
