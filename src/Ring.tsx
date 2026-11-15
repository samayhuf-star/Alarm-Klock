import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { useAudioPlayer } from 'expo-audio'; import { useKeepAwake } from 'expo-keep-awake';
import { Alarm } from './types'; import { Mission } from './missions'; import { C } from './theme';
export default function Ring({ alarm, onSolved }: { alarm: Alarm; onSolved: () => void }) {
  useKeepAwake();
  const player = useAudioPlayer(require('../assets/alarm.wav'));
  const [step, setStep] = useState(0);
  useEffect(() => {
    player.loop = true; player.volume = alarm.gentle ? 0.15 : 1; player.play();
    Vibration.vibrate([0, 600, 400], true);
    let v = alarm.gentle ? 0.15 : 1;
    const t = alarm.gentle ? setInterval(() => { v = Math.min(1, v + 0.1); player.volume = v; }, 6000) : undefined;
    return () => { if (t) clearInterval(t); player.pause(); Vibration.cancel(); };
  }, []);
  const ms = alarm.missions.length ? alarm.missions : (['math'] as const);
  const done = () => { if (step + 1 >= ms.length) onSolved(); else setStep(step + 1); };
  return (<View style={s.c}>
    <Text style={s.time}>{String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}</Text>
    <Text style={s.lab}>{alarm.label || 'Time to wake up'} · Mission {step + 1}/{ms.length}</Text>
    <View style={s.box}><Mission key={step} id={ms[step]} onDone={done} qrValue={alarm.qrValue} /></View>
    <Text style={s.hint}>The alarm stops only when every mission is done.</Text>
  </View>);
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, alignItems: 'center' },
  time: { color: C.accent2, fontSize: 64, fontWeight: '900' }, lab: { color: C.dim, fontSize: 16, marginBottom: 30 },
  box: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }, hint: { color: C.dim, marginBottom: 30, fontSize: 13 } });
