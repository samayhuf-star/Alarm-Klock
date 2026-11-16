import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Vibration, BackHandler, Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio'; import { useKeepAwake } from 'expo-keep-awake'; import * as Haptics from 'expo-haptics';
import { Alarm, MissionId } from './types'; import { SOUND_SRC } from './sounds'; import { Btn } from './missions/ui'; import { Mission } from './missions'; import { C } from './theme';
import { pickSurprise } from './logic';
const LINES = ['Up up up! 🔥', 'Your bed is lying to you.', 'Finish the mission. Then you are free.', 'Future you says thanks.', 'No snooze. No mercy. 💪', 'Almost there. Keep going!'];
export default function Ring({ alarm, onSolved, preview }: { alarm: Alarm; onSolved: () => void; preview?: boolean }) {
  useKeepAwake();
  const player = useAudioPlayer(SOUND_SRC[alarm.sound || 'classic']);
  const [step, setStep] = useState(0); const [line, setLine] = useState(0);
  // "Surprise me" is resolved once per ring.
  const ms = useMemo<MissionId[]>(() => (alarm.missions.length ? alarm.missions : ['math' as MissionId]).map((m) => (m === 'surprise' ? (pickSurprise() as MissionId) : m)), [alarm.id]);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    player.loop = true; player.volume = alarm.gentle ? 0.15 : 1; player.play();
    // Loud, never-ending vibration until the missions are done.
    const buzz = () => { Vibration.vibrate(Platform.OS === 'android' ? [0, 800, 300] : 800, Platform.OS === 'android'); };
    buzz();
    const vib = Platform.OS === 'ios' ? setInterval(() => { Vibration.vibrate(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }, 1000) : undefined;
    // Keep the audio from being paused by the system (calls, other audio) and keep volume maxed in app.
    const keep = setInterval(() => { try { if (!player.playing) player.play(); if (!alarm.gentle) player.volume = 1; } catch {} }, 2000);
    const talk = setInterval(() => setLine((l) => (l + 1) % LINES.length), 5000);
    let v = alarm.gentle ? 0.15 : 1;
    const ramp = alarm.gentle ? setInterval(() => { v = Math.min(1, v + 0.1); player.volume = v; }, 6000) : undefined;
    const back = preview ? undefined : BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { [vib, keep, talk, ramp].forEach((t) => t && clearInterval(t)); back?.remove(); player.pause(); Vibration.cancel(); };
  }, []);
  const done = () => { if (step + 1 >= ms.length) onSolved(); else setStep(step + 1); };
  return (<View style={s.c}>
    <Text style={s.time}>{String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}</Text>
    <Text style={s.lab}>{alarm.label || 'Time to wake up'} · Mission {step + 1}/{ms.length}</Text>
    <Text style={s.quote}>{LINES[line]}</Text>
    <View style={s.box}><Mission key={step} id={ms[step]} onDone={done} qrValue={alarm.qrValue} /></View>
    {preview ? <Btn t="Stop test" kind="ghost" onPress={onSolved} style={{ marginBottom: 24 }} /> : <Text style={s.hint}>It will not stop until every mission is done.</Text>}
  </View>);
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, alignItems: 'center' },
  time: { color: C.accent2, fontSize: 64, fontWeight: '900' }, lab: { color: C.dim, fontSize: 16, marginBottom: 8 },
  quote: { color: C.accent, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  box: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }, hint: { color: C.dim, marginBottom: 30, fontSize: 13 } });
