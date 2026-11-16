import React from 'react';
import { MissionId } from '../types';
import MathM from './Math'; import Shake from './Shake'; import Tilt from './Tilt';
import Memory from './Memory'; import Typing from './Typing'; import Qr from './Qr'; import Photo from './Photo';
import Exercise from './Exercise'; import Plank from './Plank'; import Steps from './Steps'; import Stroop from './Stroop';
/** `surprise` must be resolved to a concrete mission by the caller (Ring) before rendering. */
export function Mission({ id, onDone, qrValue }: { id: MissionId; onDone: () => void; qrValue?: string }) {
  switch (id) {
    case 'math': return <MathM onDone={onDone} />; case 'shake': return <Shake onDone={onDone} />;
    case 'tilt': return <Tilt onDone={onDone} />; case 'memory': return <Memory onDone={onDone} />;
    case 'typing': return <Typing onDone={onDone} />; case 'stroop': return <Stroop onDone={onDone} />;
    case 'qr': return <Qr onDone={onDone} expected={qrValue} />; case 'photo': return <Photo onDone={onDone} />;
    case 'pushups': case 'squat': case 'situps': case 'jacks': return <Exercise kind={id} onDone={onDone} />;
    case 'plank': return <Plank onDone={onDone} />; case 'steps': return <Steps onDone={onDone} />;
    case 'surprise': return <MathM onDone={onDone} />;
  }
}
