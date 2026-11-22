import React, { useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Btn, Title } from './ui'; import { C } from '../theme';
const gen = () => { const a = 12 + Math.floor(Math.random() * 38), b = 3 + Math.floor(Math.random() * 12), c = 10 + Math.floor(Math.random() * 40); return { q: `${a} × ${b} + ${c}`, r: a * b + c }; };
export default function MathMission({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0); const [v, setV] = useState(''); const [bad, setBad] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- n is the re-roll trigger
  const p = useMemo(() => gen(), [n]);
  return (<View style={{ width: '100%' }}>
    <Title t="Solve it" sub={`Problem ${n + 1} of 3`} />
    <Text style={{ color: C.accent, fontSize: 44, fontWeight: '900', textAlign: 'center', marginBottom: 20 }}>{p.q}</Text>
    <TextInput value={v} onChangeText={(x) => { setV(x); setBad(false); }} keyboardType="number-pad" placeholder="Answer" placeholderTextColor={C.dim}
      style={{ backgroundColor: C.card2, color: C.text, fontSize: 28, textAlign: 'center', padding: 14, borderRadius: 14, marginBottom: 14, borderWidth: bad ? 2 : 0, borderColor: C.accent2 }} />
    <Btn t="Check" onPress={() => { if (Number(v) === p.r) { setV(''); if (n === 2) onDone(); else setN(n + 1); } else setBad(true); }} />
  </View>);
}
