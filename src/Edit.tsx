import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { Alarm, DAYS, MISSIONS, MissionId } from './types'; import { canUseMission } from './logic'; import { useAudioPlayer, setAudioModeAsync } from 'expo-audio'; import { SOUNDS, SOUND_SRC, SoundId } from './sounds'; import { Btn } from './missions/ui'; import { C } from './theme';
export default function Edit({ initial, pro, onSave, onCancel, onDelete, onNeedPro, onTest }: { initial: Alarm; pro: boolean; onSave: (a: Alarm) => void; onCancel: () => void; onDelete?: () => void; onNeedPro: () => void; onTest: (a: Alarm) => void }) {
  const [a, setA] = useState(initial);
  const player = useAudioPlayer(SOUND_SRC[initial.sound || 'classic']); const [playing, setPlaying] = useState<SoundId | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only audio setup; cleanup pauses the initial player
  React.useEffect(() => { setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); return () => { try { player.pause(); } catch {} }; }, []);
  const preview = (id: SoundId) => {
    if (playing === id) { player.pause(); setPlaying(null); return; }
    // eslint-disable-next-line react-hooks/immutability -- expo-audio players are configured by assignment
    player.replace(SOUND_SRC[id]); player.loop = true; player.volume = 1; player.play(); setPlaying(id);
    setA((x) => ({ ...x, sound: id }));
  };
  const step = (k: 'hour' | 'minute', d: number) => setA({ ...a, [k]: (a[k] + d + (k === 'hour' ? 24 : 60)) % (k === 'hour' ? 24 : 60) });
  const toggleM = (id: MissionId, needsPro?: boolean) => {
    if (needsPro && !canUseMission(id, pro)) return onNeedPro();
    setA({ ...a, missions: a.missions.includes(id) ? a.missions.filter((x) => x !== id) : [...a.missions, id] });
  };
  const renderCol = (k: 'hour' | 'minute') => (<View style={{ alignItems: 'center' }}>
    <Pressable onPress={() => step(k, k === 'hour' ? 1 : 5)}><Text style={s.arrow}>▲</Text></Pressable>
    <Text style={s.big}>{String(a[k]).padStart(2, '0')}</Text>
    <Pressable onPress={() => step(k, k === 'hour' ? -1 : -5)}><Text style={s.arrow}>▼</Text></Pressable></View>);
  return (<ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20 }}>{renderCol('hour')}<Text style={s.big}>:</Text>{renderCol('minute')}</View>
    <TextInput value={a.label} onChangeText={(label) => setA({ ...a, label })} placeholder="Label (optional)" placeholderTextColor={C.dim} style={s.input} />
    <View style={s.row}>{DAYS.map((d, i) => { const on = a.days.includes(i + 1); return (
      <Pressable key={i} onPress={() => setA({ ...a, days: on ? a.days.filter((x) => x !== i + 1) : [...a.days, i + 1] })} style={[s.day, on && { backgroundColor: C.accent }]}>
        <Text style={{ color: on ? '#1a1200' : C.text, fontWeight: '800' }}>{d}</Text></Pressable>); })}</View>
    <Text style={s.sec}>Alarm sound (tap to select and preview, tap again to stop)</Text>
    {SOUNDS.map((so) => { const on = (a.sound || 'classic') === so.id; return (
      <Pressable key={so.id} onPress={() => preview(so.id)} style={[s.m, on && { borderColor: C.accent }]}>
        <View style={{ flex: 1 }}><Text style={s.mn}>{so.name}</Text><Text style={{ color: C.dim }}>{so.desc}</Text></View>
        <Text style={{ color: on ? C.accent : C.dim, fontSize: 24 }}>{playing === so.id ? '■' : '▶'}</Text></Pressable>); })}
    <Text style={s.sec}>Missions (done in order, the alarm will not stop until all are done)</Text>
    {(['Surprise', 'Brain', 'Workout'] as const).map((g) => (<View key={g}>
      <Text style={[s.sec, { color: C.accent, marginTop: 6 }]}>{g === 'Surprise' ? '🎲 Surprise' : g === 'Brain' ? '🧠 Brain' : '💪 Workout'}</Text>
      {MISSIONS.filter((m) => m.group === g).map((m) => { const on = a.missions.includes(m.id); return (
        <Pressable key={m.id} onPress={() => toggleM(m.id, m.pro)} style={[s.m, on && { borderColor: C.accent }]}>
          <View style={{ flex: 1 }}><Text style={s.mn}>{m.name}{m.pro && !pro ? '  🔒' : ''}</Text><Text style={{ color: C.dim }}>{m.desc}</Text></View>
          <Text style={{ color: on ? C.accent : C.dim, fontSize: 22 }}>{on ? '●' : '○'}</Text></Pressable>); })}
    </View>))}
    {a.missions.includes('qr') && <TextInput value={a.qrValue || ''} onChangeText={(qrValue) => setA({ ...a, qrValue })} placeholder="Text of your QR code (blank = any)" placeholderTextColor={C.dim} style={s.input} />}
    <View style={[s.m, { justifyContent: 'space-between' }]}><View><Text style={s.mn}>Gentle wake</Text><Text style={{ color: C.dim }}>Sound fades in over about 20 seconds</Text></View>
      <Switch value={a.gentle} onValueChange={(gentle) => setA({ ...a, gentle })} trackColor={{ true: C.accent }} /></View>
    <Btn t="Try this alarm now" kind="ghost" onPress={() => { player.pause(); setPlaying(null); onTest(a); }} style={{ marginTop: 6 }} />
    <Btn t="Save alarm" onPress={() => { player.pause(); onSave(a); }} style={{ marginTop: 16 }} />
    <Btn t="Cancel" kind="ghost" onPress={() => { try { player.pause(); } catch {} onCancel(); }} style={{ marginTop: 10 }} />
    {onDelete && <Btn t="Delete (asks first)" kind="ghost" onPress={onDelete} style={{ marginTop: 10 }} />}
  </ScrollView>);
}
const s = StyleSheet.create({ big: { color: C.text, fontSize: 64, fontWeight: '900' }, arrow: { color: C.dim, fontSize: 22, padding: 6 },
  input: { backgroundColor: C.card, color: C.text, padding: 14, borderRadius: 14, marginBottom: 14, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, day: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  sec: { color: C.dim, marginBottom: 10, fontWeight: '700' }, m: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' }, mn: { color: C.text, fontSize: 17, fontWeight: '700' } });
