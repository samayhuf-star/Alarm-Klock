import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Title } from './ui'; import { C } from '../theme';
// Stand up and hold the phone upright (portrait) for 10 seconds.
export default function Tilt({ onDone }: { onDone: () => void }) {
  const [sec, setSec] = useState(0); const [ok, setOk] = useState(false); const t = useRef<any>(null); const s = useRef(0);
  useEffect(() => {
    Accelerometer.setUpdateInterval(200);
    const sub = Accelerometer.addListener(({ y, z }) => setOk(Math.abs(y) > 0.85 && Math.abs(z) < 0.35));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    t.current = setInterval(() => { if (ok) { s.current++; setSec(s.current); if (s.current >= 10) { clearInterval(t.current); onDone(); } } else { s.current = 0; setSec(0); } }, 1000);
    return () => clearInterval(t.current);
  }, [ok]);
  return (<View style={{ alignItems: 'center' }}><Title t="Stand up" sub="Hold the phone upright for 10 seconds" />
    <Text style={{ color: ok ? C.ok : C.accent2, fontSize: 90, fontWeight: '900' }}>{sec}s</Text></View>);
}
