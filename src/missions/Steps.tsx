import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Pedometer, Accelerometer } from 'expo-sensors'; import * as Haptics from 'expo-haptics';
import { Title } from './ui'; import { C } from '../theme';
// Walk N steps. Uses the pedometer; falls back to accelerometer step detection if unavailable.
export default function Steps({ onDone, goal = 30 }: { onDone: () => void; goal?: number }) {
  const [c, setC] = useState(0); const done = useRef(false);
  const finish = (n: number) => { setC(n); if (n >= goal && !done.current) { done.current = true; onDone(); } };
  useEffect(() => {
    let sub: { remove: () => void } | null = null; let cancelled = false;
    (async () => {
      let ok = false; try { ok = await Pedometer.isAvailableAsync(); if (ok) { const p = await Pedometer.requestPermissionsAsync(); ok = p.granted; } } catch { ok = false; }
      if (cancelled) return;
      if (ok) { sub = Pedometer.watchStepCount((r) => finish(r.steps)); return; }
      let n = 0; let last = 0; Accelerometer.setUpdateInterval(50);
      sub = Accelerometer.addListener(({ x, y, z }) => { const g = Math.sqrt(x * x + y * y + z * z); const now = Date.now(); if (g > 1.25 && now - last > 350) { last = now; n++; Haptics.selectionAsync(); finish(n); } });
    })();
    return () => { cancelled = true; sub?.remove(); };
  }, []);
  return (<View style={{ alignItems: 'center' }}><Title t="🚶 Walk it off" sub="Get out of bed and walk" />
    <Text style={{ color: C.accent, fontSize: 90, fontWeight: '900' }}>{c}/{goal}</Text><Text style={{ color: C.dim }}>steps</Text></View>);
}
