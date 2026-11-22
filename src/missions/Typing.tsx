import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Btn, Title } from './ui'; import { C } from '../theme';
const P = ['I am awake and ready to win the day', 'Getting up now beats regret later', 'Cold feet on the floor, I am up', 'Today I choose discipline over snooze'];
export default function Typing({ onDone }: { onDone: () => void }) {
  const [p] = useState(() => P[Math.floor(Math.random() * P.length)]); const [v, setV] = useState('');
  const ok = v.trim().toLowerCase() === p.toLowerCase();
  return (<View style={{ width: '100%' }}><Title t="Type it exactly" />
    <Text style={{ color: C.accent, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 18 }}>{p}</Text>
    <TextInput value={v} onChangeText={setV} autoCapitalize="none" autoCorrect={false} placeholder="Type here" placeholderTextColor={C.dim}
      style={{ backgroundColor: C.card2, color: C.text, fontSize: 18, padding: 14, borderRadius: 14, marginBottom: 14 }} />
    <Btn t={ok ? 'Done' : 'Keep typing'} onPress={() => ok && onDone()} /></View>);
}
