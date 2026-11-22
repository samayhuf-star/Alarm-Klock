import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Vibration, Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio'; import { useKeepAwake } from 'expo-keep-awake'; import * as Haptics from 'expo-haptics';
import { Alarm, MissionId } from './types'; import { SOUND_SRC } from './sounds'; import { Btn } from './missions/ui'; import { Mission } from './missions'; import { C } from './theme';
import { pickSurprise } from './logic'; import { holdNative } from './native';
const LINES = ['Up up up! 🔥', 'Your bed is lying to you.', 'Finish the mission. Then you are free.', 'Future you says thanks.', 'No snooze. No mercy. 💪', 'Almost there. Keep going!'];
export default function Ring({ alarm, onSolved, preview }: { alarm: Alarm; onSolved: () => void; preview?: boolean }) {
  useKeepAwake();
  const player = useAudioPlayer(SOUND_SRC[alarm.sound || 'classic']);
  const [step, setStep] = useState(0); const [line, setLine] = useState(0); const [stuck, setStuck] = useState(false); const [fallback, setFallback] = useState(false);
  // "Surprise me" is resolved once per ring.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the alarm changes
  const ms = useMemo<MissionId[]>(() => (alarm.missions.length ? alarm.missions : ['math' as MissionId]).map((m) => (m === 'surprise' ? (pickSurprise() as MissionId) : m)), [alarm.id]);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
    // eslint-disable-next-line react-hooks/immutability -- expo-audio players are configured by assignment
    player.loop = true; player.volume = alarm.gentle ? 0.15 : 1; player.play();
    // Loud, never-ending vibration until the missions are done.
    const buzz = () => { Vibration.vibrate(Platform.OS === 'android' ? [0, 800, 300] : 800, Platform.OS === 'android'); };
    buzz();
    const vib = Platform.OS === 'ios' ? setInterval(() => { Vibration.vibrate(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }, 1000) : undefined;
    // Keep the audio from being paused by the system (calls, other audio) and keep volume maxed in app.
    const keep = setInterval(() => { try { if (!player.playing) player.play(); if (!alarm.gentle) player.volume = 1; } catch {} }, 2000);
    // Native alarm: while the user is in the app doing missions, quiet the system ring; if the app dies, the ring returns natively.
    const hold = preview ? undefined : setInterval(() => holdNative(alarm.id, 45), 20000); if (!preview) holdNative(alarm.id, 45);
    const talk = setInterval(() => setLine((l) => (l + 1) % LINES.length), 5000);
    let v = alarm.gentle ? 0.15 : 1;
    const ramp = alarm.gentle ? setInterval(() => { v = Math.min(1, v + 0.1); player.volume = v; }, 6000) : undefined;
    return () => { [vib, keep, talk, ramp, hold].forEach((t) => t && clearInterval(t)); player.pause(); Vibration.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only setup; reads initial alarm values
  }, []);
  // Safety valve: if a mission does not register for 20s, offer plain math so the alarm can never trap you.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when the mission step changes
  useEffect(() => { setStuck(false); setFallback(false); const t = setTimeout(() => setStuck(true), 90000); return () => clearTimeout(t); }, [step]);
  const done = () => { if (step + 1 >= ms.length) onSolved(); else setStep(step + 1); };
  return (<View style={s.c}>
    <Text style={s.time}>{String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}</Text>
    <Text style={s.lab}>{alarm.label || 'Time to wake up'} · Mission {step + 1}/{ms.length}</Text>
    <Text style={s.quote}>{LINES[line]}</Text>
    <View style={s.box}><Mission key={`${step}-${fallback}`} id={fallback ? 'math' : ms[step]} onDone={done} qrValue={alarm.qrValue} /></View>
    {stuck && !fallback && !preview && <Btn t="Mission not working? Do math instead" kind="ghost" onPress={() => setFallback(true)} style={{ marginBottom: 12 }} />}
    {preview ? <Btn t="Stop test" kind="ghost" onPress={onSolved} style={{ marginBottom: 24 }} /> : <Text style={s.hint}>It will not stop until every mission is done.</Text>}
  </View>);
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, alignItems: 'center' },
  time: { color: C.accent2, fontSize: 64, fontWeight: '900' }, lab: { color: C.dim, fontSize: 16, marginBottom: 8 },
  quote: { color: C.accent, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  box: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }, hint: { color: C.dim, marginBottom: 30, fontSize: 13 } });
