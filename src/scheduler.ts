import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './types';
import { soundFile } from './sounds';
import { scheduleNative, cancelNative, completeNative } from './native';
import { planTriggers, minutesUntilNext, formatIn } from './logic';

const channelId = (id: string, gentle?: boolean) => `alarms-${id}${gentle ? '_gentle' : ''}`;
export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    for (const id of ['classic', 'digital', 'siren', 'rise', 'chime']) {
      for (const gentle of [false, true]) {
        await Notifications.setNotificationChannelAsync(channelId(id, gentle), {
          // eslint-disable-next-line import/namespace -- exists in expo-notifications; the namespace check cannot see it
          name: `Alarms (${id}${gentle ? ', gentle' : ''})`, importance: Notifications.AndroidImportance.MAX,
          sound: `${id}${gentle ? '_gentle' : ''}.wav`, vibrationPattern: [0, 500, 300, 500], bypassDnd: true,
          // eslint-disable-next-line import/namespace -- exists in expo-notifications; the namespace check cannot see it
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    }
  }
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: false } });
  return p.granted;
}

const content = (a: Alarm, n: number) => ({
  title: n === 0 ? (a.label || 'Wake up!') : `Still asleep? (${n})`,
  body: 'Open Alarm Klock to complete your mission and stop the alarm.',
  sound: soundFile(a.sound, a.gentle), data: { alarmId: a.id },
  interruptionLevel: 'timeSensitive' as const, priority: Notifications.AndroidNotificationPriority.MAX,
});

// Backup alarms: each alarm schedules the main ring plus follow-ups one minute apart (count capped by backupsPerAlarm to stay under iOS's 64 pending limit).
export async function scheduleAlarm(a: Alarm, opts: { skipTodayFollowUps?: boolean; backups?: number } = {}): Promise<string[]> {
  await cancelAlarm(a);
  // iOS 26+: a real system alarm (AlarmKit) rings on the lock screen with the app closed. No notification backups needed then.
  if (await scheduleNative(a)) return [];
  const ids: string[] = [];
  const now = new Date(); const today = now.getDay() + 1; const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const t of planTriggers(a, new Date(), opts.backups)) {
    // After solving, drop today's remaining follow-ups (restored when alarms are rescheduled on next app launch).
    if (opts.skipTodayFollowUps && t.kind === 'weekly' && t.n > 0 && t.weekday === today && t.hour * 60 + t.minute >= nowMin) continue;
    ids.push(await Notifications.scheduleNotificationAsync({
      content: content(a, t.n),
      trigger: t.kind === 'date'
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.date, channelId: channelId(a.sound || 'classic', a.gentle) }
        : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute, channelId: channelId(a.sound || 'classic', a.gentle) },
    }));
  }
  return ids;
}

export async function cancelAlarm(a: Alarm) {
  await cancelNative(a.id);
  for (const id of a.notifIds) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
// After a mission is completed, silence this alarm's pending follow-up rings for today.
export async function silenceFollowUps(a: Alarm) {
  await completeNative(a.id); // ends the AlarmKit ring (no-op where unsupported)
  await Notifications.dismissAllNotificationsAsync();
  if (a.days.length === 0) await cancelAlarm(a);
}
export async function cancelAllScheduled() { await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}); }
export const nextRing = (a: Alarm) => formatIn(minutesUntilNext(a));
