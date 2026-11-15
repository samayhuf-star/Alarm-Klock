import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './types';

export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarms', importance: Notifications.AndroidImportance.MAX,
      sound: 'default', vibrationPattern: [0, 500, 300, 500], bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: false } });
  return p.granted;
}

const content = (a: Alarm, n: number) => ({
  title: n === 0 ? (a.label || 'Wake up!') : `Still asleep? (${n})`,
  body: 'Open Alarm Klock to complete your mission and stop the alarm.',
  sound: true as const, data: { alarmId: a.id },
  interruptionLevel: 'timeSensitive' as const, priority: Notifications.AndroidNotificationPriority.MAX,
});

// Backup alarms: each alarm schedules the main ring plus 3 follow-ups, one minute apart.
export async function scheduleAlarm(a: Alarm): Promise<string[]> {
  await cancelAlarm(a);
  if (!a.enabled) return [];
  const ids: string[] = [];
  for (let n = 0; n < 4; n++) {
    const total = a.hour * 60 + a.minute + n;
    const h = Math.floor(total / 60) % 24, m = total % 60;
    const dayShift = total >= 1440 ? 1 : 0;
    if (a.days.length === 0) {
      const d = new Date(); d.setHours(h, m, 0, 0);
      if (dayShift) d.setDate(d.getDate() + 1);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      ids.push(await Notifications.scheduleNotificationAsync({
        content: content(a, n), trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: 'alarms' },
      }));
    } else {
      for (const day of a.days) {
        const wd = ((day - 1 + dayShift) % 7) + 1;
        ids.push(await Notifications.scheduleNotificationAsync({
          content: content(a, n),
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: wd, hour: h, minute: m, channelId: 'alarms' },
        }));
      }
    }
  }
  return ids;
}

export async function cancelAlarm(a: Alarm) {
  for (const id of a.notifIds) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
// After a mission is completed, silence this alarm's pending follow-up rings for today.
export async function silenceFollowUps(a: Alarm) {
  await Notifications.dismissAllNotificationsAsync();
  if (a.days.length === 0) await cancelAlarm(a);
}
export function nextRing(a: Alarm): string {
  const now = new Date(); const t = a.hour * 60 + a.minute; const nowM = now.getHours() * 60 + now.getMinutes();
  let add = 0;
  if (a.days.length === 0) add = t > nowM ? 0 : 1;
  else for (let i = 0; i < 8; i++) { const d = ((now.getDay() + i) % 7) + 1; if (a.days.includes(d) && (i > 0 || t > nowM)) { add = i; break; } }
  const mins = add * 1440 + t - nowM; const h = Math.floor(mins / 60), m = mins % 60;
  return `Rings in ${h}h ${m}m`;
}
