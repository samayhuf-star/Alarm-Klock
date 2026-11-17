# Pricing (decision of 17 Nov 2026)

One plan for the app: **weekly subscription, $1.99 per week, 7-day free trial** (new subscribers).
Applies to every app except Klenzer. Monthly, yearly and lifetime plans are retired from the paywall.

## Store and RevenueCat setup to match
- App Store Connect: auto-renewing subscription `com.samay.alarmklock.premium.weekly`, duration 1 week, price $1.99 (US tier), introductory offer = free trial, 1 week, all territories.
- Google Play (where the app ships there): matching base plan, weekly, $1.99, free-trial offer of 7 days. The app is a free download with the subscription inside it (Play does not allow a trial on an upfront-paid app).
- RevenueCat: entitlement `premium` attached to the weekly product; `default` offering has one WEEKLY package; paywall copy reads "7 days free, then $1.99/week".
- Remove old monthly / yearly / lifetime packages from the offering. Do not delete the old products if anyone already bought them; they stay recognised.

Supersedes the 14 Nov decision ($2.99/month, $19.99/year). Free tier after the trial is unchanged (2 alarms, 4 missions).


---
## Earlier notes (superseded)
# Alarm Klock pricing
Decided by Samay (14 Nov 2026): free for 7 days, then $2.99/month or $19.99/year.
RevenueCat entitlement: `premium`. Offering: `default` (packages `monthly`, `annual`).
Free tier after trial: 2 alarms, 4 missions (math, shake, memory, typing). Pro: unlimited alarms, all 8 missions.
Competitor table and regional price review still to do before store launch.

## RevenueCat setup (17 Nov 2026)
Project "Alarm Klock" (72ebcd5c), iOS app com.samay.alarmklock, entitlement `premium`, default offering with monthly and yearly packages (Lifetime removed). Products still to create in App Store Connect: monthly $2.99, yearly $19.99 with 7-day free trial, then attach to the offering and build the RevenueCat paywall.
