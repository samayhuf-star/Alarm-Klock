// OneSignal remote push. Local alarm notifications stay on expo-notifications (see scheduler.ts);
// the system permission is requested there, and OneSignal picks up the same grant.
import { OneSignal } from 'react-native-onesignal';

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
let started = false;

export function initPush() {
  if (started || !APP_ID) return;
  try { OneSignal.initialize(APP_ID); started = true; } catch { /* push is optional: never block the alarm app */ }
}
