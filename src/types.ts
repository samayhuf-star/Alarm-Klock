import type { SoundId } from './sounds';
export type MissionId = 'math' | 'shake' | 'memory' | 'typing' | 'stroop' | 'tilt' | 'qr' | 'photo'
  | 'pushups' | 'squat' | 'situps' | 'jacks' | 'plank' | 'steps' | 'surprise';
export type Alarm = {
  id: string; hour: number; minute: number; label: string; enabled: boolean;
  days: number[]; // 1=Sun..7=Sat (expo weekday). empty = one-time
  missions: MissionId[]; notifIds: string[]; gentle: boolean; qrValue?: string; sound?: SoundId;
  temp?: boolean; fireAt?: number; // sleep timers: exact epoch ms, removed after use
};
export type MissionInfo = { id: MissionId; name: string; desc: string; group: 'Brain' | 'Workout' | 'Surprise'; pro?: boolean };
export const MISSIONS: MissionInfo[] = [
  { id: 'surprise', name: 'Surprise me', desc: 'A random mission every morning', group: 'Surprise' },
  { id: 'math', name: 'Math', desc: 'Solve 3 sums', group: 'Brain' },
  { id: 'memory', name: 'Memory', desc: 'Repeat the pattern', group: 'Brain' },
  { id: 'typing', name: 'Typing', desc: 'Type the phrase', group: 'Brain' },
  { id: 'stroop', name: 'Color clash', desc: 'Tap the color, not the word', group: 'Brain' },
  { id: 'shake', name: 'Shake', desc: 'Shake phone 30 times', group: 'Workout' },
  { id: 'pushups', name: 'Push-ups', desc: '10 push-ups, phone on chest', group: 'Workout', pro: true },
  { id: 'squat', name: 'Squats', desc: '10 squats', group: 'Workout', pro: true },
  { id: 'situps', name: 'Sit-ups', desc: '10 sit-ups', group: 'Workout', pro: true },
  { id: 'jacks', name: 'Jumping jacks', desc: '20 jumping jacks', group: 'Workout', pro: true },
  { id: 'plank', name: 'Plank', desc: 'Hold a plank for 30 seconds', group: 'Workout', pro: true },
  { id: 'steps', name: 'Walk', desc: 'Walk 30 steps', group: 'Workout', pro: true },
  { id: 'tilt', name: 'Stand up', desc: 'Hold phone upright 10 seconds', group: 'Workout', pro: true },
  { id: 'qr', name: 'QR scan', desc: 'Scan your bathroom code', group: 'Workout', pro: true },
  { id: 'photo', name: 'Photo', desc: 'Snap a photo of a set object', group: 'Workout', pro: true },
];
export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
