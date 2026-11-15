import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { C } from '../theme';
export const Btn = ({ t, onPress, kind = 'main', style }: { t: string; onPress: () => void; kind?: 'main' | 'ghost'; style?: any }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [s.btn, kind === 'ghost' && s.ghost, pressed && { opacity: 0.7 }, style]}>
    <Text style={[s.bt, kind === 'ghost' && { color: C.text }]}>{t}</Text>
  </Pressable>
);
export const Title = ({ t, sub }: { t: string; sub?: string }) => (
  <View style={{ alignItems: 'center', marginBottom: 20 }}>
    <Text style={s.h}>{t}</Text>{sub ? <Text style={s.sub}>{sub}</Text> : null}
  </View>
);
export const s = StyleSheet.create({
  btn: { backgroundColor: C.accent, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center' },
  ghost: { backgroundColor: C.card2 }, bt: { color: '#1a1200', fontWeight: '800', fontSize: 17 },
  h: { color: C.text, fontSize: 28, fontWeight: '800' }, sub: { color: C.dim, marginTop: 6, fontSize: 15 },
});
