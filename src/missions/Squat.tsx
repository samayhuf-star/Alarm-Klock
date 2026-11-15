import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors'; import * as Haptics from 'expo-haptics';
import { Title } from './ui'; import { C } from '../theme';
// Hold phone against your chest. A squat = a down-then-up vertical motion burst.
export default function Squat({ onDone, goal = 10 }: { onDone: () => void; goal?: number }) {
  const [c, setC] = useState(0); const cnt = useRef(0); const phase = useRef<'idle' | 'down'>('idle'); const last = useRef(0);
  useEffect(() => {
    Accelerometer.setUpdateInterval(60);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z); const now = Date.now();
      if (phase.current === 'idle' && g < 0.8) phase.current = 'down';
      else if (phase.current === 'down' && g > 1.25 && now - last.current > 900) {
        phase.current = 'idle'; last.current = now; cnt.current++; setC(cnt.current); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (cnt.current >= goal) onDone();
      }
    });
    return () => sub.remove();
  }, []);
  return (<View style={{ alignItems: 'center' }}><Title t="Squats" sub="Hold the phone to your chest and squat" />
    <Text style={{ color: C.accent, fontSize: 90, fontWeight: '900' }}>{c}/{goal}</Text></View>);
}
