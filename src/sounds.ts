export type SoundId = 'classic' | 'digital' | 'siren' | 'rise' | 'chime';
export const SOUNDS: { id: SoundId; name: string; desc: string }[] = [
  { id: 'classic', name: 'Classic', desc: 'Two-tone beeps' },
  { id: 'digital', name: 'Digital', desc: 'Sharp triple beep' },
  { id: 'siren', name: 'Siren', desc: 'Sweeping, very loud' },
  { id: 'rise', name: 'Rise', desc: 'Rising melody' },
  { id: 'chime', name: 'Chime', desc: 'Soft bell' },
];
export const SOUND_SRC = {
  classic: require('../assets/sounds/classic.wav'), digital: require('../assets/sounds/digital.wav'),
  siren: require('../assets/sounds/siren.wav'), rise: require('../assets/sounds/rise.wav'), chime: require('../assets/sounds/chime.wav'),
} as const;
export const soundFile = (id?: string) => `${id && id in SOUND_SRC ? id : 'classic'}.wav`;
