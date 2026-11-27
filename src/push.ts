// OneSignal remote push, used only for optional wake-up tips. Alarms never depend on it:
// they stay local (react-native-alarm-scheduler + expo-notifications, see scheduler.ts).
// Consent is required before OneSignal sends or collects anything; the user opts in on the
// "Morning tips" onboarding screen, and the choice is stored locally.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
const KEY = 'push.tipsConsent.v1';
let started = false;

export async function initPush() {
  if (started || !APP_ID) return;
  try {
    OneSignal.setConsentRequired(true);
    OneSignal.initialize(APP_ID);
    started = true;
    if ((await AsyncStorage.getItem(KEY)) === '1') OneSignal.setConsentGiven(true);
  } catch { /* push is optional: never block the alarm app */ }
}

export async function setTipsConsent(given: boolean) {
  try {
    await AsyncStorage.setItem(KEY, given ? '1' : '0');
    if (!started) await initPush();
    if (started) OneSignal.setConsentGiven(given);
  } catch { /* ignore */ }
}
