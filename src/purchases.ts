import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';

export const ENTITLEMENT = 'premium';
let ready = false;
export function initPurchases(onChange: (pro: boolean) => void) {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  if (!key) { onChange(false); return; }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: key });
  ready = true;
  const f = (i: CustomerInfo) => onChange(!!i.entitlements.active[ENTITLEMENT]);
  Purchases.addCustomerInfoUpdateListener(f);
  Purchases.getCustomerInfo().then(f).catch(() => {});
  Purchases.setAttributes({ app: 'alarm-klock' });
}
export async function showPaywall(): Promise<boolean> {
  if (!ready) return false;
  const r = await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: ENTITLEMENT });
  return r === PAYWALL_RESULT.PURCHASED || r === PAYWALL_RESULT.RESTORED || r === PAYWALL_RESULT.NOT_PRESENTED;
}
export async function openCustomerCenter() { if (ready) await RevenueCatUI.presentCustomerCenter(); }
export async function restore() { if (ready) await Purchases.restorePurchases(); }
