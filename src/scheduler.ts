import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './types';
import { soundFile } from './sounds';
import { planTriggers, minutesUntilNext, formatIn } from './logic';

export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    for (const id of ['classic', 'digital', 'siren', 'rise', 'chime']) {
      await Notifications.setNotificationChannelAsync(`alarms-${id}`, {
        name: `Alarms (${id})`, importance: Notifications.AndroidImportance.MAX,
        sound: `${id}.wav`, vibrationPattern: [0, 500, 300, 500], bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: false } });
  return p.granted;
}

const content = (a: Alarm, n: number) => ({
  title: n === 0 ? (a.label || 'Wake up!') : `Still asleep? (${n})`,
  body: 'Open Alarm Klock to complete your mission and stop the alarm.',
  sound: soundFile(a.sound), data: { alarmId: a.id },
  interruptionLevel: 'timeSensitive' as const, priority: Notifications.AndroidNotificationPriority.MAX,
});

// Backup alarms: each alarm schedules the main ring plus 3 follow-ups, one minute apart.
export async function scheduleAlarm(a: Alarm): Promise<string[]> {
  await cancelAlarm(a);
  const ids: string[] = [];
  for (const t of planTriggers(a)) {
    ids.push(await Notifications.scheduleNotificationAsync({
      content: content(a, t.n),
      trigger: t.kind === 'date'
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.date, channelId: `alarms-${a.sound || 'classic'}` }
        : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute, channelId: `alarms-${a.sound || 'classic'}` },
    }));
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
export const nextRing = (a: Alarm) => formatIn(minutesUntilNext(a));
