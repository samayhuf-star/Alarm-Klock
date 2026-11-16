import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors'; import * as Haptics from 'expo-haptics';
import { Title, Btn } from './ui'; import { C } from '../theme';
export type ExKind = 'pushups' | 'squat' | 'situps' | 'jacks';
const CFG: Record<ExKind, { title: string; sub: string; goal: number; emoji: string; mode: 'dip' | 'peak'; gap: number }> = {
  pushups: { title: 'Push-ups', sub: 'Phone on your chest or under you. Go all the way down and up.', goal: 10, emoji: '💪', mode: 'dip', gap: 800 },
  squat: { title: 'Squats', sub: 'Hold the phone to your chest and squat.', goal: 10, emoji: '🦵', mode: 'dip', gap: 900 },
  situps: { title: 'Sit-ups', sub: 'Hold the phone to your chest. Up and down.', goal: 10, emoji: '🔥', mode: 'dip', gap: 900 },
  jacks: { title: 'Jumping jacks', sub: 'Hold the phone in one hand and jump!', goal: 20, emoji: '⚡', mode: 'peak', gap: 350 },
};
export const exerciseGoal = (k: ExKind) => CFG[k].goal;
export default function Exercise({ kind, onDone }: { kind: ExKind; onDone: () => void }) {
  const cfg = CFG[kind]; const [c, setC] = useState(0); const cnt = useRef(0); const phase = useRef<'idle' | 'down'>('idle'); const last = useRef(0); const done = useRef(false);
  const rep = () => { cnt.current++; setC(cnt.current); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); if (cnt.current >= cfg.goal && !done.current) { done.current = true; onDone(); } };
  useEffect(() => {
    Accelerometer.setUpdateInterval(60);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z); const now = Date.now();
      if (cfg.mode === 'peak') { if (g > 1.7 && now - last.current > cfg.gap) { last.current = now; rep(); } return; }
      if (phase.current === 'idle' && g < 0.85) phase.current = 'down';
      else if (phase.current === 'down' && g > 1.2 && now - last.current > cfg.gap) { phase.current = 'idle'; last.current = now; rep(); }
    });
    return () => sub.remove();
  }, []);
  const pct = Math.min(100, (c / cfg.goal) * 100);
  return (<View style={{ alignItems: 'center', width: '100%' }}><Title t={`${cfg.emoji} ${cfg.title}`} sub={cfg.sub} />
    <Text style={{ color: C.accent, fontSize: 90, fontWeight: '900' }}>{c}/{cfg.goal}</Text>
    <View style={{ width: '80%', height: 12, borderRadius: 6, backgroundColor: C.card2, marginVertical: 16 }}><View style={{ width: `${pct}%`, height: 12, borderRadius: 6, backgroundColor: C.ok }} /></View>
    <Btn kind="ghost" t="Count a rep manually (if sensor misses)" onPress={rep} style={{ marginTop: 8 }} /></View>);
}
