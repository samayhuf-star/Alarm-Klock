import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors'; import * as Haptics from 'expo-haptics';
import { Title } from './ui'; import { C } from '../theme';
// Phone on the floor/back. Timer runs while still; moving resets progress.
export default function Plank({ onDone, goal = 30 }: { onDone: () => void; goal?: number }) {
  const [t, setT] = useState(0); const [moving, setMoving] = useState(false); const lastG = useRef(1); const lastMove = useRef(0); const tt = useRef(0); const done = useRef(false);
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => { const g = Math.sqrt(x * x + y * y + z * z); if (Math.abs(g - lastG.current) > 0.35) lastMove.current = Date.now(); lastG.current = g; });
    const iv = setInterval(() => {
      const mv = Date.now() - lastMove.current < 800; setMoving(mv);
      if (mv) { tt.current = Math.max(0, tt.current - 1); } else { tt.current += 1; if (tt.current % 5 === 0) Haptics.selectionAsync(); }
      setT(Math.floor(tt.current / 5)); // 5 ticks/s? interval below is 1s/5
      if (tt.current >= goal * 5 && !done.current) { done.current = true; onDone(); }
    }, 200);
    return () => { sub.remove(); clearInterval(iv); };
  }, []);
  return (<View style={{ alignItems: 'center' }}><Title t="🧱 Plank" sub="Place the phone beside you and hold still" />
    <Text style={{ color: moving ? C.accent2 : C.ok, fontSize: 90, fontWeight: '900' }}>{t}s</Text>
    <Text style={{ color: C.dim, fontSize: 16 }}>{moving ? 'Hold steady! Timer is draining' : `Hold ${goal} seconds`}</Text></View>);
}
