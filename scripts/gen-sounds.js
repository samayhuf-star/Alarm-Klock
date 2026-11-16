// Generates the 5 bundled alarm sounds (25s each, under iOS's 30s notification limit).
const fs = require('fs'); const SR = 16000, DUR = 25, N = SR * DUR;
function wav(name, f) {
  const b = Buffer.alloc(44 + N * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + N * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) { const v = Math.max(-1, Math.min(1, f(i / SR))); b.writeInt16LE(Math.round(v * 30000), 44 + i * 2); }
  fs.writeFileSync(`assets/sounds/${name}.wav`, b);
}
const S = (f, t) => Math.sin(2 * Math.PI * f * t);
wav('classic', (t) => ((t % 0.5) < 0.25 ? S(t % 1 < 0.5 ? 880 : 1175, t) * 0.9 : 0));
wav('digital', (t) => { const p = t % 1; return (p < 0.1 || (p > 0.2 && p < 0.3) || (p > 0.4 && p < 0.5)) ? S(1500, t) * 0.85 : 0; });
wav('siren', (t) => S(900 + 400 * Math.sin(2 * Math.PI * 0.8 * t), t) * 0.8);
const notes = [523.25, 659.25, 783.99, 1046.5];
wav('rise', (t) => { const p = t % 2, i = Math.floor(p / 0.5), q = p % 0.5; return (S(notes[i], t) + 0.3 * S(notes[i] * 2, t)) * Math.exp(-q * 4) * 0.8; });
wav('chime', (t) => { const q = t % 3; return (S(880, t) + 0.5 * S(1760, t) + 0.25 * S(2640, t)) * Math.exp(-q * 1.8) * 0.6; });
