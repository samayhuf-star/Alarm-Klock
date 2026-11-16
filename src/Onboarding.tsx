import React, { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { C } from './theme';

type Page = { emoji: string; title: string; body: string; colors: [string, string] };
const PAGES: Page[] = [
  { emoji: '⏰', title: 'Wake up. For real.', body: 'Alarm Klock keeps ringing until you prove you are awake. No more snoozing through your day.', colors: ['#2B1B05', '#0B0B14'] },
  { emoji: '🧠', title: 'Missions that wake your brain', body: 'Solve math, memory and typing puzzles, shake, scan a QR code, do steps, a plank or workout. Pick what works for you.', colors: ['#1B1B4A', '#0B0B14'] },
  { emoji: '🌙', title: 'Sleep timers and gentle wake-up', body: 'Tap a power nap or full night in one touch, with a soft ramp-up so mornings feel kinder.', colors: ['#0F2A3A', '#0B0B14'] },
  { emoji: '🔥', title: 'Build a streak', body: 'Finish your mission every morning and watch your streak grow. Small wins, every day.', colors: ['#3A1020', '#0B0B14'] },
];
const GET = [
  ['🎯', 'Every mission type, unlimited alarms'],
  ['🔔', 'Relentless ring that follows up until you are up'],
  ['🎵', 'Custom sounds with preview and a test button'],
  ['😴', 'Sleep timers, surprise mode and streaks'],
];

export default function Onboarding({ onDone }: { onDone: (showPaywall: boolean) => void }) {
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const ref = useRef<FlatList>(null);
  const last = PAGES.length; // index of "what you get"
  const next = () => (i < last ? ref.current?.scrollToIndex({ index: i + 1 }) : onDone(true));
  const data = [...PAGES, null];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <FlatList
        ref={ref} data={data} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(_, k) => String(k)}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <LinearGradient colors={item ? item.colors : ['#2B1B05', '#0B0B14']} style={{ width, flex: 1, paddingHorizontal: 28, paddingTop: 120 }}>
            {item ? (<>
              <Text style={{ fontSize: 96, marginBottom: 28 }}>{item.emoji}</Text>
              <Text style={s.h}>{item.title}</Text><Text style={s.b}>{item.body}</Text>
            </>) : (<>
              <Text style={s.h}>What you get</Text>
              <Text style={[s.b, { marginBottom: 20 }]}>Try everything free for 7 days. Cancel any time.</Text>
              {GET.map(([e, t]) => (<View key={t} style={s.row}><Text style={{ fontSize: 26, marginRight: 14 }}>{e}</Text><Text style={s.rowT}>{t}</Text></View>))}
            </>)}
          </LinearGradient>)} />
      <View style={s.foot}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18 }}>
          {data.map((_, k) => <View key={k} style={[s.dot, k === i && { backgroundColor: C.accent, width: 22 }]} />)}
        </View>
        <Pressable onPress={next} style={s.btn}><Text style={s.btnT}>{i < last ? 'Continue' : 'Start 7-day free trial'}</Text></Pressable>
        {i === last
          ? <Pressable onPress={() => onDone(false)} style={{ padding: 14 }}><Text style={{ color: C.dim, textAlign: 'center', fontWeight: '700' }}>Maybe later, use the free version</Text></Pressable>
          : <Pressable onPress={() => ref.current?.scrollToIndex({ index: last })} style={{ padding: 14 }}><Text style={{ color: C.dim, textAlign: 'center', fontWeight: '700' }}>Skip</Text></Pressable>}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  h: { color: C.text, fontSize: 34, fontWeight: '900', marginBottom: 14 }, b: { color: C.dim, fontSize: 17, lineHeight: 25 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10 }, rowT: { color: C.text, fontSize: 16, fontWeight: '700', flex: 1 },
  foot: { position: 'absolute', bottom: 34, left: 24, right: 24 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line, marginHorizontal: 4 },
  btn: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 18, alignItems: 'center' }, btnT: { color: '#1a1200', fontSize: 18, fontWeight: '900' },
});
