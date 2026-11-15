import React from 'react';
import { MissionId } from '../types';
import MathM from './Math'; import Shake from './Shake'; import Squat from './Squat'; import Tilt from './Tilt';
import Memory from './Memory'; import Typing from './Typing'; import Qr from './Qr'; import Photo from './Photo';
export function Mission({ id, onDone, qrValue }: { id: MissionId; onDone: () => void; qrValue?: string }) {
  switch (id) {
    case 'math': return <MathM onDone={onDone} />; case 'shake': return <Shake onDone={onDone} />;
    case 'squat': return <Squat onDone={onDone} />; case 'tilt': return <Tilt onDone={onDone} />;
    case 'memory': return <Memory onDone={onDone} />; case 'typing': return <Typing onDone={onDone} />;
    case 'qr': return <Qr onDone={onDone} expected={qrValue} />; case 'photo': return <Photo onDone={onDone} />;
  }
}
