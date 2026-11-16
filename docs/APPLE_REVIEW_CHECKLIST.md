# Apple review pre-flight (Stage 8)
| Item | Status |
|---|---|
| Restore Purchases in app | done (home screen and RevenueCat paywall) |
| Paywall shows price, period, trial, renewal, Terms, Privacy | pending: set in RevenueCat paywall editor |
| Privacy policy URL live | pending: docs/PRIVACY.md needs hosting |
| Camera and motion purpose strings | done in app.json |
| App Privacy labels match code | pending at submission |
| No placeholder screens | done |
| Background audio mode justified | review: remove UIBackgroundModes audio if lock-screen ringing is not implemented |
| Real-device alarm reliability test | pending |

## Added 17 Nov 2026 (deep review)
| Item | Status |
|---|---|
| Privacy manifest reasons (UserDefaults CA92.1, FileTimestamp) | done in app.json (needs new build) |
| ITSAppUsesNonExemptEncryption=false | done in app.json (needs new build) |
| Go Pro does nothing while RevenueCat keys are missing (2.1 / 3.1.1 risk) | BLOCKER: set EXPO_PUBLIC_RC_IOS_KEY, create IAP products, offering and paywall before App Review |
| Paywall shows price, period, trial, renewal, Terms, Privacy; no trial toggle | pending in RevenueCat paywall editor |
| App Privacy labels: Purchases + User ID (RevenueCat), not used for tracking | pending at submission |
| Review notes: use "Try this alarm now" and sleep timers to test, no account needed | pending at submission |
| Background audio mode (2.5.4) | removed (user decision 17 Nov) |
| 4.3(b) saturated category: lead with workouts, sleep timers, Stroop in metadata | pending at submission |
