export type MissionId = 'math' | 'shake' | 'memory' | 'typing' | 'tilt' | 'squat' | 'qr' | 'photo';
export type Alarm = {
  id: string; hour: number; minute: number; label: string; enabled: boolean;
  days: number[]; // 1=Sun..7=Sat (expo weekday). empty = one-time
  missions: MissionId[]; notifIds: string[]; gentle: boolean; qrValue?: string;
};
export const MISSIONS: { id: MissionId; name: string; desc: string; pro?: boolean }[] = [
  { id: 'math', name: 'Math', desc: 'Solve 3 sums' },
  { id: 'shake', name: 'Shake', desc: 'Shake phone 30 times' },
  { id: 'memory', name: 'Memory', desc: 'Repeat the pattern' },
  { id: 'typing', name: 'Typing', desc: 'Type the phrase' },
  { id: 'tilt', name: 'Tilt', desc: 'Hold phone upright', pro: true },
  { id: 'squat', name: 'Squats', desc: 'Do 10 squats', pro: true },
  { id: 'qr', name: 'QR scan', desc: 'Scan your bathroom code', pro: true },
  { id: 'photo', name: 'Photo', desc: 'Snap a photo of a set object', pro: true },
];
export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
