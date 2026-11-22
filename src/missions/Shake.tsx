import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors'; import * as Haptics from 'expo-haptics';
import { Title } from './ui'; import { C } from '../theme';
export default function Shake({ onDone, goal = 30 }: { onDone: () => void; goal?: number }) {
  const [c, setC] = useState(0); const last = useRef(0); const cnt = useRef(0);
  useEffect(() => {
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const g = Math.sqrt(x * x + y * y + z * z); const now = Date.now();
      if (g > 1.9 && now - last.current > 250) { last.current = now; cnt.current++; setC(cnt.current); Haptics.impactAsync(); if (cnt.current >= goal) onDone(); }
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only sensor subscription
  }, []);
  return (<View style={{ alignItems: 'center' }}><Title t="Shake it!" sub="Keep shaking your phone" />
    <Text style={{ color: C.accent, fontSize: 90, fontWeight: '900' }}>{c}/{goal}</Text></View>);
}
