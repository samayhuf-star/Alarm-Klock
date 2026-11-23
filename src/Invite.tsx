import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, Share, Linking, Platform, StyleSheet, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { C } from './theme'; import { inviteMessage, normalizeCode } from './logic';
import { hello, redeem, APP_URL, Me } from './referral';

/** Bottom sheet: your invite code + share buttons, and a field to enter a friend's code. */
export default function Invite({ paid, onClose }: { paid?: boolean; onClose: () => void }) {
  const [me, setMe] = useState<Me | null>(null); const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(''); const [busy, setBusy] = useState(false); const [note, setNote] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { hello().then((m) => { setMe(m); setLoading(false); }); }, []); // mounted fresh each time it opens
  const msg = me ? inviteMessage(me.code, APP_URL) : '';
  const open = (url: string) => Linking.openURL(url).catch(() => Share.share({ message: msg }));
  const go = async () => { setBusy(true); const err = await redeem(normalizeCode(entry)); setBusy(false); setNote(err ? { ok: false, t: err } : { ok: true, t: 'Done! You and your friend each got 1 month of Pro.' }); if (!err) setEntry(''); };
  const ways = [
    { icon: '↗', label: 'Share', run: () => Share.share({ message: msg }) },
    { icon: '💬', label: 'Messages', run: () => open(`sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(msg)}`) },
    { icon: '🟢', label: 'WhatsApp', run: () => open(`https://wa.me/?text=${encodeURIComponent(msg)}`) },
  ];
  return (<Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.dim}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      <View style={s.sheet}>
        <View style={s.grab} />
        <View style={s.head}><Text style={s.title}>{paid ? 'Welcome to Pro! Invite friends' : 'Invite friends'}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={s.x} accessibilityLabel="Close"><Text style={{ color: C.text, fontSize: 18, fontWeight: '700' }}>✕</Text></Pressable></View>
        <View style={s.art}><Text style={{ fontSize: 44 }}>⏰</Text><View style={s.gift}><Text style={{ fontSize: 52 }}>🎁</Text></View><Text style={{ fontSize: 44 }}>⏰</Text></View>
        {loading ? <ActivityIndicator color={C.accent} style={{ marginVertical: 22 }} />
          : me ? <Pressable onPress={() => Share.share({ message: msg })} style={s.code} accessibilityLabel={`Your invite code ${me.code}. Tap to share.`}><Text style={s.codeT}>{me.code}</Text></Pressable>
            : <Text style={[s.body, { color: C.accent2 }]}>Could not load your code. Check your connection and open this again.</Text>}
        <Text style={s.body}>Invite a friend and you will both get 1 month of Pro free when they enter your code here within 48 hours of installing.{me ? ` ${me.usesLeft} uses left.` : ''}</Text>
        <View style={s.row}>{ways.map((w) => (<Pressable key={w.label} disabled={!me} onPress={w.run} style={[s.way, !me && { opacity: 0.4 }]}>
          <View style={s.wayI}><Text style={{ fontSize: 24, color: C.text }}>{w.icon}</Text></View><Text style={s.wayT}>{w.label}</Text></Pressable>))}</View>
        <Text style={s.have}>Got a code from a friend?</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput value={entry} onChangeText={(t) => setEntry(normalizeCode(t))} placeholder="ENTER CODE" placeholderTextColor={C.dim} autoCapitalize="characters" autoCorrect={false} maxLength={6} style={s.input} />
          <Pressable disabled={busy || entry.length < 6} onPress={go} style={[s.redeem, (busy || entry.length < 6) && { opacity: 0.4 }]}>{busy ? <ActivityIndicator color="#1a1200" /> : <Text style={{ color: '#1a1200', fontWeight: '800' }}>Redeem</Text>}</Pressable></View>
        {note && <Text style={{ color: note.ok ? C.ok : C.accent2, marginTop: 10, textAlign: 'center' }}>{note.t}</Text>}
      </View></KeyboardAvoidingView></Modal>);
}
const s = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 22, paddingBottom: 40, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 40 }, title: { color: C.text, fontSize: 19, fontWeight: '800' },
  x: { position: 'absolute', right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  art: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 18 },
  gift: { width: 104, height: 104, borderRadius: 52, backgroundColor: C.card2, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  code: { alignSelf: 'stretch', backgroundColor: C.bg, borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingVertical: 16, marginTop: 18, alignItems: 'center' },
  codeT: { color: C.accent, fontSize: 30, fontWeight: '900', letterSpacing: 8 },
  body: { color: C.dim, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.line },
  way: { alignItems: 'center', width: 90 }, wayI: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }, wayT: { color: C.text, fontSize: 13, marginTop: 8 },
  have: { color: C.dim, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  input: { flex: 1, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 4, paddingHorizontal: 14, paddingVertical: 12 },
  redeem: { backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 20, justifyContent: 'center', minWidth: 96, alignItems: 'center' },
});
