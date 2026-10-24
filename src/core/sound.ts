// Web Audio로 만드는 아주 짧은 효과음. 외부 파일 없음.

let ctx: AudioContext | null = null;

function ensure(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, ms: number, type: OscillatorType, gain = 0.08): void {
  const c = ensure();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + ms / 1000);
}

export const sfx = {
  hit: () => tone(880, 70, 'sine'),
  miss: () => tone(160, 140, 'square', 0.05),
  done: () => {
    tone(660, 120, 'sine');
    setTimeout(() => tone(880, 120, 'sine'), 120);
    setTimeout(() => tone(1100, 200, 'sine'), 240);
  },
};
