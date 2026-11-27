import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

type Theme = { bg: [string, string, string]; ink: string; sub: string; chip: string };
const SUN: Theme = { bg: ['#1B1340', '#7A2E6E', '#FF8A5B'], ink: '#FFF8EE', sub: '#FFD9C2', chip: 'rgba(255,255,255,0.14)' };
const DAY: Theme = { bg: ['#2B2A6B', '#5B4BB5', '#FFC46B'], ink: '#FFFBF2', sub: '#FFE9C4', chip: 'rgba(255,255,255,0.16)' };
const NIGHT: Theme = { bg: ['#0B0B1E', '#1B1A4A', '#3B2C86'], ink: '#F4F1FF', sub: '#C9C2F5', chip: 'rgba(255,255,255,0.10)' };

/** Layered sun built from plain Views, so it renders the same on iOS, Android and web. */
function Sun({ size = 200 }: { size?: number }) {
  const ring = (k: number, o: number) => <View key={k} style={{ position: 'absolute', width: size * k, height: size * k, borderRadius: size, backgroundColor: `rgba(255,200,120,${o})` }} />;
  return (<View style={{ width: size * 1.7, height: size * 1.7, alignItems: 'center', justifyContent: 'center' }}>
    {ring(1.7, 0.08)}{ring(1.4, 0.14)}{ring(1.15, 0.22)}
    <LinearGradient colors={['#FFE08A', '#FF9A5A']} style={{ width: size, height: size, borderRadius: size / 2 }} /></View>);
}
function AlarmClock() {
  return (<View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', gap: 120, marginBottom: -14 }}>{[0, 1].map((i) => <View key={i} style={s.bell} />)}</View>
    <LinearGradient colors={['#FFFFFF', '#FFE9D2']} style={s.clock}>
      <Text style={s.clockT}>6:30</Text><Text style={s.clockS}>NO SNOOZE</Text></LinearGradient></View>);
}
function MissionStack() {
  const cards = [{ e: '🧮', t: 'Math', c: '#FFB020' }, { e: '📳', t: 'Shake', c: '#FF5C7A' }, { e: '🧠', t: 'Memory', c: '#3DDC97' }, { e: '⌨️', t: 'Typing', c: '#6C8CFF' }];
  return (<View style={{ width: 280, height: 290 }}>{cards.map((c, i) => (
    <View key={c.t} style={[s.mcard, { backgroundColor: c.c, top: i * 66, left: 16 + (i % 2) * 24, transform: [{ rotate: `${(i - 1.5) * 4}deg` }] }]}>
      <Text style={{ fontSize: 28 }}>{c.e}</Text><Text style={s.mt}>{c.t}</Text></View>))}</View>);
}
function Moon() {
  return (<View style={{ alignItems: 'center' }}>
    <LinearGradient colors={['#E8E4FF', '#A99DF0']} style={{ width: 150, height: 150, borderRadius: 75 }} />
    <View style={{ position: 'absolute', top: -6, right: -26, width: 130, height: 130, borderRadius: 65, backgroundColor: '#1B1A4A' }} />
    <View style={s.pill}><Text style={{ fontSize: 15, color: '#fff', fontWeight: '800' }}>🔕  Silent mode on  ·  alarm still rings</Text></View></View>);
}

type Step = { theme: Theme; art: React.ReactNode; title: string; body: string; bullets?: string[] };
const STEPS: Step[] = [
  { theme: SUN, art: <Sun />, title: 'Wake up for real', body: 'Your alarm only stops when your brain is awake too. No more snooze spirals.' },
  { theme: DAY, art: <AlarmClock />, title: 'Beat the snooze button', body: 'Set one alarm. Skip the groggy tap and prove you are up with a quick mission.' },
  { theme: NIGHT, art: <MissionStack />, title: 'Missions that wake your brain', body: 'Solve math, shake your phone, repeat a pattern or type a phrase.' },
  { theme: NIGHT, art: <Moon />, title: 'Rings even on Silent', body: 'On iOS 26 and later, alarms ring through Silent and Focus. We will ask for alarm permission next.' },
  { theme: SUN, art: <Sun size={120} />, title: 'What you get', body: 'Start free, upgrade when you want more.', bullets: ['Free: 2 alarms and 6 missions', 'Pro: unlimited alarms', 'Pro: all 15 missions, incl. workouts, QR and photo'] },
];

export default function Onboarding({ onDone }: { onDone: (wantsPro: boolean) => void }) {
  const [i, setI] = useState(0); const st = STEPS[i]; const last = i === STEPS.length - 1; const { height } = useWindowDimensions(); const t = st.theme;
  return (<LinearGradient colors={t.bg} style={s.c}><StatusBar style="light" />
    <View style={s.top}><View style={s.bars}>{STEPS.map((_, n) => <View key={n} style={[s.bar, { backgroundColor: n <= i ? t.ink : 'rgba(255,255,255,0.25)' }]} />)}</View>
      <Pressable onPress={() => onDone(false)} hitSlop={12}><Text style={{ color: t.sub, fontWeight: '700' }}>Skip</Text></Pressable></View>
    <View style={[s.art, { minHeight: height * 0.34 }]}>{st.art}</View>
    <View style={s.copy}><Text style={[s.t, { color: t.ink }]}>{st.title}</Text><Text style={[s.b, { color: t.sub }]}>{st.body}</Text>
      {st.bullets?.map((x) => <View key={x} style={[s.row, { backgroundColor: t.chip }]}><Text style={{ color: '#FFD36B', fontSize: 18, fontWeight: '900' }}>✓</Text><Text style={[s.li, { color: t.ink }]}>{x}</Text></View>)}</View>
    <Pressable style={s.cta} onPress={() => (last ? onDone(true) : setI(i + 1))}><Text style={s.ctaT}>{last ? 'See Pro plans' : 'Continue'}</Text></Pressable>
    {last ? <Pressable onPress={() => onDone(false)} style={{ padding: 14 }}><Text style={{ color: t.sub, textAlign: 'center', fontWeight: '700' }}>Continue with free</Text></Pressable> : <View style={{ height: 46 }} />}
  </LinearGradient>);
}
const s = StyleSheet.create({ c: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, bars: { flex: 1, flexDirection: 'row', gap: 5 }, bar: { flex: 1, height: 4, borderRadius: 2 },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' }, copy: { paddingBottom: 18 },
  t: { fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 }, b: { fontSize: 17, lineHeight: 25 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 10 }, li: { fontSize: 16, fontWeight: '700', flex: 1 },
  cta: { backgroundColor: '#FFC24B', borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, ctaT: { color: '#2A1500', fontSize: 18, fontWeight: '900' },
  bell: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFC24B' },
  clock: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: '#FFC24B' }, clockT: { fontSize: 56, fontWeight: '900', color: '#2A1500' }, clockS: { fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#C2410C', marginTop: 2 },
  mcard: { position: 'absolute', width: 220, height: 62, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }, mt: { fontSize: 22, fontWeight: '900', color: '#1a1200' },
  pill: { marginTop: 34, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 } });
