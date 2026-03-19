let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export const SFX = {
  gather() {
    // Short woody "chop" sound
    playTone(200, 0.08, 'square', 0.1);
    setTimeout(() => playTone(150, 0.06, 'square', 0.08), 50);
  },
  build() {
    // Ascending hammer hits
    playTone(300, 0.1, 'square', 0.1);
    setTimeout(() => playTone(400, 0.1, 'square', 0.08), 120);
    setTimeout(() => playTone(500, 0.15, 'triangle', 0.1), 240);
  },
  boardAnimal() {
    // Happy ascending melody
    playTone(440, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(554, 0.15, 'sine', 0.1), 150);
    setTimeout(() => playTone(659, 0.2, 'sine', 0.12), 300);
  },
  placeArk() {
    // Deep satisfying thud + chime
    playTone(100, 0.3, 'sine', 0.15);
    setTimeout(() => playTone(600, 0.4, 'triangle', 0.08), 200);
  },
  divineIntervention() {
    // Ethereal ascending shimmer
    playTone(400, 0.5, 'sine', 0.08);
    setTimeout(() => playTone(600, 0.4, 'sine', 0.08), 100);
    setTimeout(() => playTone(800, 0.3, 'sine', 0.1), 200);
    setTimeout(() => playTone(1200, 0.5, 'triangle', 0.06), 350);
  },
  coatPitch() {
    // Squishy low sound
    playTone(120, 0.2, 'sawtooth', 0.06);
    setTimeout(() => playTone(90, 0.15, 'sawtooth', 0.04), 100);
  },
  rivalNearby() {
    // Warning low pulse
    playTone(180, 0.3, 'sine', 0.08);
    setTimeout(() => playTone(160, 0.3, 'sine', 0.06), 350);
  },
};
