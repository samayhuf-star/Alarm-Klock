# Alarm Klock pricing
Decided by Samay (14 Nov 2026): free for 7 days, then $2.99/month or $19.99/year.
RevenueCat entitlement: `premium`. Offering: `default` (packages `monthly`, `annual`).
Free tier after trial: 2 alarms, 4 missions (math, shake, memory, typing). Pro: unlimited alarms, all 8 missions.
Competitor table and regional price review still to do before store launch.

## RevenueCat setup (17 Nov 2026)
Project "Alarm Klock" (72ebcd5c), iOS app com.samay.alarmklock, entitlement `premium`, default offering with monthly and yearly packages (Lifetime removed). Products still to create in App Store Connect: monthly $2.99, yearly $19.99 with 7-day free trial, then attach to the offering and build the RevenueCat paywall.

## Update 22 Nov 2026
No free trial for now. Live prices $2.99/month and $19.99/year in all countries; the weekly product was deleted. Free tier: 2 alarms and 6 missions (math, memory, typing, color clash, shake, surprise). Pro: unlimited alarms and all 15 missions. Onboarding: 5 screens, then "What you get", then the RevenueCat paywall or Continue with free.

## Update 27 Nov 2026 (v1.0.2)
Paywall (RevenueCat, offering for entitlement `premium`) should show 4 packages: $rc_weekly=com.samay.alarmklock.weekly2, $rc_monthly, $rc_annual, $rc_lifetime=com.samay.alarmklock.lifetime. Packages are attached in the RevenueCat dashboard. Onboarding: 10 screens (ONBOARDING_SCREENS) with an opt-in "Morning tips" screen that gives OneSignal consent; alarms stay local.
