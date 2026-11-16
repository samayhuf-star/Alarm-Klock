import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Title } from './ui'; import { C } from '../theme';
const COLORS = [{ n: 'RED', c: '#FF4D4D' }, { n: 'BLUE', c: '#4DA3FF' }, { n: 'GREEN', c: '#3DDC97' }, { n: 'YELLOW', c: '#FFD13D' }];
const make = () => { const w = Math.floor(Math.random() * 4); let k = Math.floor(Math.random() * 4); if (k === w) k = (k + 1) % 4; return { word: w, ink: k }; };
export default function Stroop({ onDone, goal = 5 }: { onDone: () => void; goal?: number }) {
  const [q, setQ] = useState(make); const [ok, setOk] = useState(0); const [msg, setMsg] = useState('Tap the COLOR of the text, not the word');
  const tap = (i: number) => { if (i === q.ink) { if (ok + 1 >= goal) { onDone(); return; } setOk(ok + 1); setMsg('Nice!'); } else { setOk(0); setMsg('Wrong, start again'); } setQ(make()); };
  return (<View style={{ alignItems: 'center' }}><Title t="🎨 Color clash" sub={msg} />
    <Text style={{ color: COLORS[q.ink].c, fontSize: 64, fontWeight: '900', marginVertical: 24 }}>{COLORS[q.word].n}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12, justifyContent: 'center' }}>
      {COLORS.map((c, i) => <Pressable key={i} onPress={() => tap(i)} style={{ width: 130, height: 70, borderRadius: 18, backgroundColor: c.c }} />)}
    </View><Text style={{ color: C.dim, marginTop: 16 }}>{ok}/{goal} correct in a row</Text></View>);
}
