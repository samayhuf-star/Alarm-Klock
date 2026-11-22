import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Title } from './ui';
const COLS = ['#FF5C7A', '#FFB020', '#3DDC97', '#4DA3FF'];
export default function Memory({ onDone }: { onDone: () => void }) {
  const [seq] = useState(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 4)));
  const [lit, setLit] = useState(-1); const [pos, setPos] = useState(0); const [show, setShow] = useState(true);
  const [msg, setMsg] = useState('Watch the pattern');
  const play = () => { setShow(true); setPos(0); setMsg('Watch the pattern'); seq.forEach((c, i) => { setTimeout(() => setLit(c), 700 + i * 700); setTimeout(() => setLit(-1), 700 + i * 700 + 450); }); setTimeout(() => { setShow(false); setMsg('Your turn'); }, 700 + seq.length * 700); };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- the pattern must start playing on mount
  useEffect(play, []);
  const tap = (i: number) => { if (show) return; if (i === seq[pos]) { if (pos + 1 === seq.length) onDone(); else setPos(pos + 1); } else { setMsg('Wrong! Watch again'); play(); } };
  return (<View style={{ alignItems: 'center' }}><Title t="Memory" sub={msg} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 260, gap: 12 }}>
      {COLS.map((c, i) => <Pressable key={i} onPress={() => tap(i)} style={{ width: 124, height: 124, borderRadius: 24, backgroundColor: c, opacity: lit === i ? 1 : 0.35 }} />)}
    </View></View>);
}
