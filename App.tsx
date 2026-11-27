import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, Switch, Alert, StyleSheet, AppState, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar'; import * as Notifications from 'expo-notifications';
import { Alarm } from './src/types'; import { loadAlarms, saveAlarms, loadStreak, saveStreak } from './src/store';
import { pendingNativeAlarmId } from './src/native';
import { initNotifications, scheduleAlarm, cancelAlarm, silenceFollowUps, nextRing } from './src/scheduler';
import { initPush } from './src/push';
import { initPurchases, showPaywall, openCustomerCenter, restore } from './src/purchases';
import { backupsPerAlarm, applyEdit, canAddAlarm, SLEEP_PRESETS, alarmFromDuration, isExpiredTemp, nextStreak, Streak } from './src/logic';
import AsyncStorage from '@react-native-async-storage/async-storage'; import Onboarding from './src/Onboarding';
import Edit from './src/Edit'; import Ring from './src/Ring'; import { C } from './src/theme';

const PRIVACY_URL = 'https://klenzer.online/legal/privacy/';
const TERMS_URL = 'https://klenzer.online/legal/terms/';

const blank = (): Alarm => ({ id: String(Date.now()), hour: 7, minute: 0, label: '', enabled: true, days: [2, 3, 4, 5, 6], missions: ['math'], notifIds: [], gentle: true });

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]); const [pro, setPro] = useState(false);
  const [editing, setEditing] = useState<{ a: Alarm; isNew: boolean } | null>(null); const [ringing, setRinging] = useState<Alarm | null>(null); const [test, setTest] = useState<Alarm | null>(null);
  const [onb, setOnb] = useState<boolean | null>(null); const [ok, setOk] = useState(true); const [streak, setStreak] = useState<Streak>({ count: 0, last: '' });

  const persist = useCallback(async (next: Alarm[]) => { setAlarms(next); await saveAlarms(next); }, []);
  const solvedAt = React.useRef<Record<string, number>>({}); const ringingId = React.useRef<string | null>(null);
  const ring = useCallback((id?: string) => setAlarms((cur) => {
    const a = cur.find((x) => x.id === id); if (!a) return cur;
    if (ringingId.current === a.id) return cur; // already ringing
    if (Date.now() - (solvedAt.current[a.id] || 0) < 5 * 60000) return cur; // just solved: ignore leftover follow-ups
    ringingId.current = a.id; setRinging(a); return cur;
  }), []);

  useEffect(() => {
    initPurchases(setPro); initNotifications().then(setOk); initPush(); loadStreak().then(setStreak);
    loadAlarms().then(async (list) => {
      const live = list.filter((x) => !isExpiredTemp(x)); const out: Alarm[] = [];
      const backups = backupsPerAlarm(live); for (const x of live) out.push(x.enabled ? { ...x, notifIds: await scheduleAlarm(x, { backups }) } : x); // re-arm everything on launch
      for (const x of list.filter((y) => isExpiredTemp(y))) await cancelAlarm(x);
      setAlarms(out); saveAlarms(out);
    });
    // A native (AlarmKit) ring opened the app: reconcile on launch and on every return to foreground.
    const syncNative = () => pendingNativeAlarmId().then((id) => id && setTimeout(() => ring(id), 400));
    syncNative(); const appSub = AppState.addEventListener('change', (st) => { if (st === 'active') syncNative(); });
    const r = Notifications.addNotificationResponseReceivedListener((x) => ring(x.notification.request.content.data?.alarmId as string));
    const f = Notifications.addNotificationReceivedListener((x) => ring(x.request.content.data?.alarmId as string));
    Notifications.getLastNotificationResponseAsync().then((x) => x && ring(x.notification.request.content.data?.alarmId as string));
    return () => { r.remove(); f.remove(); appSub.remove(); };
  }, []);

  const save = async (a: Alarm, isNew: boolean) => {
    if (isNew && !canAddAlarm(alarms.filter((x) => !x.temp).length, pro)) { if (!(await showPaywall())) return; }
    const edited = applyEdit(a); // sleep timers: recompute the exact fire time from the edited hour:minute
    const next = isNew ? [...alarms, edited] : alarms.map((x) => (x.id === a.id ? edited : x));
    const ids = await scheduleAlarm({ ...edited, notifIds: a.notifIds }, { backups: backupsPerAlarm(next) });
    const saved = { ...edited, notifIds: ids };
    await persist(isNew ? [...alarms, saved] : alarms.map((x) => (x.id === a.id ? saved : x))); setEditing(null);
  };
  const toggle = async (a: Alarm, enabled: boolean) => { const n = { ...a, enabled }; n.notifIds = await scheduleAlarm(n, { backups: backupsPerAlarm(alarms.map((x) => (x.id === a.id ? n : x))) }); await persist(alarms.map((x) => (x.id === a.id ? n : x))); };
  const del = (a: Alarm) => Alert.alert('Delete alarm?', 'This cannot be undone.', [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await cancelAlarm(a); await persist(alarms.filter((x) => x.id !== a.id)); setEditing(null); } }]);
  const solved = async () => {
    if (!ringing) return; const r = ringing; solvedAt.current[r.id] = Date.now(); ringingId.current = null; setRinging(null); // stop at once, clean up after
    await silenceFollowUps(r);
    if (r.temp || r.days.length === 0) { const rest = alarms.filter((x) => x.id !== r.id || (!r.temp && r.days.length > 0)); await persist(r.temp ? rest : alarms.map((x) => (x.id === r.id ? { ...x, enabled: false, notifIds: [] } : x))); }
    else { const ids = await scheduleAlarm(r, { skipTodayFollowUps: true, backups: backupsPerAlarm(alarms) }); await persist(alarms.map((x) => (x.id === r.id ? { ...x, notifIds: ids } : x))); }
    const ns = nextStreak(streak); setStreak(ns); await saveStreak(ns);
  };
  const startSleep = (p: (typeof SLEEP_PRESETS)[number]) => {
    const t = alarmFromDuration(p.label, p.minutes);
    const at = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    Alert.alert(`${p.emoji} ${p.label}`, `Wake you at ${at}. You will have to finish a mission to stop it.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Start', onPress: async () => { const ids = await scheduleAlarm(t, { backups: backupsPerAlarm([...alarms, t]) }); await persist([...alarms, { ...t, notifIds: ids }]); } }]);
  };
  useEffect(() => { AsyncStorage.getItem('onboarded.v1').then((v) => setOnb(!v)).catch(() => setOnb(false)); }, []);
  const finishOnb = async (wantsPro: boolean) => { await AsyncStorage.setItem('onboarded.v1', '1'); setOnb(false); if (wantsPro) await showPaywall(); };
  if (onb === null) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (onb) return <Onboarding onDone={finishOnb} />;
  if (test) return <Ring alarm={test} preview onSolved={() => setTest(null)} />;
  if (ringing) return <Ring alarm={ringing} onSolved={solved} />;
  if (editing) return <Edit initial={editing.a} pro={pro} onSave={(a) => save(a, editing.isNew)} onCancel={() => setEditing(null)} onDelete={editing.isNew ? undefined : () => del(editing.a)} onNeedPro={showPaywall} onTest={setTest} />;

  return (<View style={s.c}><StatusBar style="light" />
    <Text style={s.h}>Alarm Klock</Text><Text style={s.sub}>{pro ? 'Pro unlocked' : 'Free plan · upgrade to Pro'}{streak.count > 0 ? `  ·  🔥 ${streak.count}-day streak` : ''}</Text>
    {!ok && <Text style={s.warn}>Notifications are off. Alarms cannot ring until you allow them in Settings.</Text>}
    <FlatList data={alarms}
      ListHeaderComponent={<View style={{ marginBottom: 14 }}><Text style={{ color: C.dim, fontWeight: '700', marginBottom: 8 }}>Sleep timer (tap to start)</Text>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={SLEEP_PRESETS} keyExtractor={(p) => p.id} renderItem={({ item: p }) => (
          <Pressable onPress={() => startSleep(p)} style={s.chip}><Text style={{ fontSize: 22 }}>{p.emoji}</Text><Text style={{ color: C.text, fontWeight: '800' }}>{p.minutes < 60 ? `${p.minutes}m` : `${p.minutes / 60}h`}</Text><Text style={{ color: C.dim, fontSize: 11 }}>{p.label}</Text></Pressable>)} /></View>} keyExtractor={(a) => a.id} contentContainerStyle={{ paddingBottom: 120 }}
      ListEmptyComponent={<Text style={{ color: C.dim, textAlign: 'center', marginTop: 60 }}>No alarms yet. Tap + to add one.</Text>}
      ListFooterComponent={<View style={{ marginTop: 16, paddingHorizontal: 8 }}>
        <Text style={{ color: C.dim, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>Pro renews automatically at the price shown on the Pro screen until you cancel. Cancel any time in your Apple ID subscription settings, at least 24 hours before the period ends.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}><Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>Terms of Use</Text></Pressable>
          <Text style={{ color: C.dim, fontSize: 12 }}>  ·  </Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}><Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>Privacy Policy</Text></Pressable></View></View>}
      renderItem={({ item: a }) => (<Pressable onPress={() => setEditing({ a, isNew: false })} style={s.card}>
        <View style={{ flex: 1 }}><Text style={[s.t, !a.enabled && { color: C.dim }]}>{String(a.hour).padStart(2, '0')}:{String(a.minute).padStart(2, '0')}</Text>
          <Text style={s.lab}>{a.label || 'Alarm'} · {a.missions.length} mission{a.missions.length === 1 ? '' : 's'}{a.enabled ? ' · ' + nextRing(a) : ''}</Text></View>
        <Switch value={a.enabled} onValueChange={(v) => toggle(a, v)} trackColor={{ true: C.accent }} /></Pressable>)} />
    <View style={s.bar}>
      <Pressable onPress={() => (pro ? openCustomerCenter() : showPaywall())} style={s.ghost}><Text style={{ color: C.text, fontWeight: '700' }}>{pro ? 'Manage' : 'Go Pro'}</Text></Pressable>
      <Pressable onPress={() => setEditing({ a: blank(), isNew: true })} style={s.fab}><Text style={{ fontSize: 34, color: '#1a1200', fontWeight: '800' }}>+</Text></Pressable>
      <Pressable onPress={restore} style={s.ghost}><Text style={{ color: C.text, fontWeight: '700' }}>Restore</Text></Pressable></View>
  </View>);
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: C.bg, paddingTop: 70, paddingHorizontal: 20 }, h: { color: C.text, fontSize: 34, fontWeight: '900' }, sub: { color: C.accent, marginBottom: 16, fontWeight: '700' },
  warn: { color: C.accent2, marginBottom: 12 }, card: { backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  t: { color: C.text, fontSize: 40, fontWeight: '900' }, lab: { color: C.dim, marginTop: 2 },
  bar: { position: 'absolute', bottom: 34, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { backgroundColor: C.card, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginRight: 10, alignItems: 'center', minWidth: 84 },
  fab: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }, ghost: { backgroundColor: C.card2, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 } });
