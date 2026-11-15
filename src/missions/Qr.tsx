import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn, Title } from './ui'; import { C } from '../theme';
export default function Qr({ onDone, expected }: { onDone: () => void; expected?: string }) {
  const [perm, ask] = useCameraPermissions(); const [msg, setMsg] = useState('Scan your saved QR code');
  if (!perm?.granted) return <View><Title t="Camera needed" /><Btn t="Allow camera" onPress={ask} /></View>;
  return (<View style={{ width: '100%', alignItems: 'center' }}><Title t="Scan QR" sub={msg} />
    <View style={{ width: 300, height: 300, borderRadius: 24, overflow: 'hidden' }}>
      <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128'] }}
        onBarcodeScanned={({ data }) => { if (!expected || data === expected) onDone(); else setMsg('Wrong code, find the right one'); }} /></View></View>);
}
