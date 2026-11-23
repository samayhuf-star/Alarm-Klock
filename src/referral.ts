// Refer-a-friend: each install gets a short code; when a friend redeems it, both get 1 month of Pro.
// The backend (supabase/functions/referral) owns codes and grants Pro through RevenueCat.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { refreshPro } from './purchases';

const API = process.env.EXPO_PUBLIC_REFERRAL_URL;
export const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://machine.esamay.live/alarm-klock';
export const referralOn = !!API; // no backend URL in the build = the whole feature stays hidden
export type Me = { code: string; usesLeft: number };
export type InviteMoment = 'firstUse' | 'paid';

async function call(action: string, extra: object = {}): Promise<any> {
  if (!API) return null;
  try {
    const uid = await Purchases.getAppUserID();
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, uid, ...extra }) });
    return await r.json();
  } catch { return null; }
}
/** Registers this install, applies any banked free months, and returns its code. Falls back to the cached code offline. */
export async function hello(): Promise<Me | null> {
  const r = await call('hello');
  if (r?.code) { const me = { code: r.code, usesLeft: r.usesLeft }; await AsyncStorage.setItem('invite.me', JSON.stringify(me)); if (r.applied) await refreshPro(); return me; }
  try { return JSON.parse((await AsyncStorage.getItem('invite.me')) || 'null'); } catch { return null; }
}
export const REDEEM_ERRORS: Record<string, string> = {
  bad_code: 'That code does not exist. Check it and try again.', own_code: 'You cannot use your own code.',
  already_redeemed: 'You have already used an invite code.', too_late: 'Invite codes only work in the first 48 hours after installing.',
  no_uses: 'This code has no uses left.', offline: 'Could not reach the server. Try again in a moment.',
};
/** Returns '' on success, otherwise a message to show. */
export async function redeem(code: string): Promise<string> {
  const r = await call('redeem', { code });
  if (r?.ok) { await refreshPro(); return ''; }
  return REDEEM_ERRORS[r?.error] || REDEEM_ERRORS.offline;
}
/** True the first time each moment happens (and marks it shown), so each popup appears once. */
export async function shouldInvite(m: InviteMoment): Promise<boolean> {
  if (!referralOn) return false;
  const k = `invite.shown.${m}`; if (await AsyncStorage.getItem(k)) return false;
  await AsyncStorage.setItem(k, '1'); return true;
}
