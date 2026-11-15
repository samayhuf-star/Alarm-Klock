import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn, Title } from './ui';
export default function Photo({ onDone }: { onDone: () => void }) {
  const [perm, ask] = useCameraPermissions(); const ref = useRef<CameraView>(null); const [busy, setBusy] = useState(false);
  if (!perm?.granted) return <View><Title t="Camera needed" /><Btn t="Allow camera" onPress={ask} /></View>;
  return (<View style={{ width: '100%', alignItems: 'center' }}><Title t="Take a photo" sub="Go to your kitchen sink and snap it" />
    <View style={{ width: 300, height: 340, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}><CameraView ref={ref} style={{ flex: 1 }} facing="back" /></View>
    <Btn t={busy ? 'Saving…' : 'Capture'} onPress={async () => { setBusy(true); try { await ref.current?.takePictureAsync({ quality: 0.2 }); onDone(); } finally { setBusy(false); } }} /></View>);
}
