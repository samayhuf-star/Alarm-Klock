import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, Switch, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar'; import * as Notifications from 'expo-notifications';
import { Alarm } from './src/types'; import { loadAlarms, saveAlarms } from './src/store';
import { initNotifications, scheduleAlarm, cancelAlarm, silenceFollowUps, nextRing } from './src/scheduler';
import { initPurchases, showPaywall, openCustomerCenter, restore } from './src/purchases';
import Edit from './src/Edit'; import Ring from './src/Ring'; import { C } from './src/theme';

const FREE_ALARMS = 2;
const blank = (): Alarm => ({ id: String(Date.now()), hour: 7, minute: 0, label: '', enabled: true, days: [2, 3, 4, 5, 6], missions: ['math'], notifIds: [], gentle: true });

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]); const [pro, setPro] = useState(false);
  const [editing, setEditing] = useState<{ a: Alarm; isNew: boolean } | null>(null); const [ringing, setRinging] = useState<Alarm | null>(null);
  const [ok, setOk] = useState(true);

  const persist = useCallback(async (next: Alarm[]) => { setAlarms(next); await saveAlarms(next); }, []);
  const ring = useCallback((id?: string) => setAlarms((cur) => { const a = cur.find((x) => x.id === id); if (a) setRinging(a); return cur; }), []);

  useEffect(() => {
    initPurchases(setPro); initNotifications().then(setOk); loadAlarms().then(setAlarms);
    const r = Notifications.addNotificationResponseReceivedListener((x) => ring(x.notification.request.content.data?.alarmId as string));
    const f = Notifications.addNotificationReceivedListener((x) => ring(x.request.content.data?.alarmId as string));
    Notifications.getLastNotificationResponseAsync().then((x) => x && ring(x.notification.request.content.data?.alarmId as string));
    return () => { r.remove(); f.remove(); };
  }, []);

  const save = async (a: Alarm, isNew: boolean) => {
    if (isNew && !pro && alarms.length >= FREE_ALARMS) { if (!(await showPaywall())) return; }
    const ids = await scheduleAlarm({ ...a, notifIds: a.notifIds });
    const saved = { ...a, notifIds: ids };
    await persist(isNew ? [...alarms, saved] : alarms.map((x) => (x.id === a.id ? saved : x))); setEditing(null);
  };
  const toggle = async (a: Alarm, enabled: boolean) => { const n = { ...a, enabled }; n.notifIds = await scheduleAlarm(n); await persist(alarms.map((x) => (x.id === a.id ? n : x))); };
  const del = (a: Alarm) => Alert.alert('Delete alarm?', 'This cannot be undone.', [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await cancelAlarm(a); await persist(alarms.filter((x) => x.id !== a.id)); setEditing(null); } }]);
  const solved = async () => { if (!ringing) return; await silenceFollowUps(ringing); if (ringing.days.length === 0) await persist(alarms.map((x) => (x.id === ringing.id ? { ...x, enabled: false, notifIds: [] } : x))); setRinging(null); };

  if (ringing) return <Ring alarm={ringing} onSolved={solved} />;
  if (editing) return <Edit initial={editing.a} pro={pro} onSave={(a) => save(a, editing.isNew)} onCancel={() => setEditing(null)} onDelete={editing.isNew ? undefined : () => del(editing.a)} onNeedPro={showPaywall} />;

  return (<View style={s.c}><StatusBar style="light" />
    <Text style={s.h}>Alarm Klock</Text><Text style={s.sub}>{pro ? 'Pro unlocked' : 'Free trial: 7 days of everything'}</Text>
    {!ok && <Text style={s.warn}>Notifications are off. Alarms cannot ring until you allow them in Settings.</Text>}
    <FlatList data={alarms} keyExtractor={(a) => a.id} contentContainerStyle={{ paddingBottom: 120 }}
      ListEmptyComponent={<Text style={{ color: C.dim, textAlign: 'center', marginTop: 60 }}>No alarms yet. Tap + to add one.</Text>}
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
  fab: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }, ghost: { backgroundColor: C.card2, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 } });
