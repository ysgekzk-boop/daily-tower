/**
 * Daily Tower - Web Audio Synthesizer Sound Effects
 *
 * Fully synthesized sound effects using the Web Audio API without external audio files.
 * Designed to fail gracefully and silently in non-browser or muted environments.
 */

export type SfxName =
  | 'click'
  | 'attack'
  | 'hit'
  | 'critical'
  | 'weak'
  | 'shield'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'victory'
  | 'defeat'
  | 'reward'
  | 'event'
  | 'boss'
  | 'leap'
  | 'unlock';

export const SFX_STORAGE_KEY = 'DAILY_TOWER_SFX_MUTED';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

/**
 * Returns whether SFX is currently muted according to localStorage.
 */
export function isSfxMuted(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(SFX_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Updates the mute state in localStorage.
 */
export function setSfxMuted(muted: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SFX_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // silently ignore storage errors (e.g. private browsing quota)
  }
}

/**
 * Lazily instantiates and returns the shared AudioContext singleton.
 * Returns null if Web Audio API is unsupported.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtxClass();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Lazily configures and returns the master gain node (master volume ~0.2).
 */
function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain || masterGain.context !== ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

/**
 * Generates a 1-second white noise buffer for reuse across synthesized sounds.
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    const bufferSize = Math.floor(ctx.sampleRate * 1.0);
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

/**
 * Helper to play an oscillator tone with an envelope.
 */
function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  options: {
    type?: OscillatorType;
    freqStart: number;
    freqEnd?: number;
    startTime: number;
    duration: number;
    gainPeak?: number;
    gainEnd?: number;
    attack?: number;
    rampType?: 'linear' | 'exponential';
  }
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = options.type ?? 'sine';
  const t0 = options.startTime;
  const dur = options.duration;
  const tEnd = t0 + dur;

  const f0 = Math.max(10, options.freqStart);
  const f1 = Math.max(10, options.freqEnd ?? options.freqStart);

  osc.frequency.setValueAtTime(f0, t0);
  if (options.freqEnd !== undefined && options.freqEnd !== options.freqStart) {
    if (options.rampType === 'exponential') {
      osc.frequency.exponentialRampToValueAtTime(f1, tEnd);
    } else {
      osc.frequency.linearRampToValueAtTime(f1, tEnd);
    }
  }

  const gPeak = options.gainPeak ?? 0.8;
  const gEnd = Math.max(0.0001, options.gainEnd ?? 0.0001);
  const attack = Math.min(dur * 0.5, options.attack ?? 0.01);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(gPeak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(gEnd, tEnd);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(t0);
  osc.stop(tEnd);
}

/**
 * Helper to play a filtered noise burst with an envelope.
 */
function playNoise(
  ctx: AudioContext,
  dest: AudioNode,
  options: {
    startTime: number;
    duration: number;
    filterType?: BiquadFilterType;
    filterFreqStart?: number;
    filterFreqEnd?: number;
    filterQ?: number;
    gainPeak?: number;
  }
): void {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const gain = ctx.createGain();
  const t0 = options.startTime;
  const dur = options.duration;
  const tEnd = t0 + dur;

  const gPeak = options.gainPeak ?? 0.5;
  const attack = Math.min(0.02, dur * 0.2);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(gPeak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  let outNode: AudioNode = source;

  if (options.filterType && options.filterFreqStart) {
    const filter = ctx.createBiquadFilter();
    filter.type = options.filterType;
    filter.frequency.setValueAtTime(options.filterFreqStart, t0);
    if (options.filterFreqEnd && options.filterFreqEnd !== options.filterFreqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(10, options.filterFreqEnd), tEnd);
    }
    if (options.filterQ) {
      filter.Q.setValueAtTime(options.filterQ, t0);
    }
    source.connect(filter);
    outNode = filter;
  }

  outNode.connect(gain);
  gain.connect(dest);

  source.start(t0);
  source.stop(tEnd);
}

/**
 * Synthesizers for each SFX preset.
 */
const SFX_SYNTHESIZERS: Record<SfxName, (ctx: AudioContext, master: AudioNode) => void> = {
  // click: UI クリックの小さなチッという音
  click: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 1200,
      freqEnd: 800,
      startTime: t,
      duration: 0.04,
      gainPeak: 0.35,
      attack: 0.002,
    });
    playNoise(ctx, master, {
      startTime: t,
      duration: 0.02,
      filterType: 'highpass',
      filterFreqStart: 3000,
      gainPeak: 0.15,
    });
  },

  // attack: 斬撃の風切り（ノイズの下降スイープ）
  attack: (ctx, master) => {
    const t = ctx.currentTime;
    playNoise(ctx, master, {
      startTime: t,
      duration: 0.18,
      filterType: 'bandpass',
      filterFreqStart: 3200,
      filterFreqEnd: 350,
      filterQ: 2.5,
      gainPeak: 0.6,
    });
  },

  // hit: 打撃の衝撃（低いサイン波のドロップ＋ノイズ）
  hit: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 150,
      freqEnd: 35,
      startTime: t,
      duration: 0.18,
      gainPeak: 0.8,
      attack: 0.004,
      rampType: 'exponential',
    });
    playNoise(ctx, master, {
      startTime: t,
      duration: 0.1,
      filterType: 'lowpass',
      filterFreqStart: 800,
      filterFreqEnd: 200,
      gainPeak: 0.5,
    });
  },

  // critical: 会心用。hit より鋭く金属的な高音を重ねる
  critical: (ctx, master) => {
    const t = ctx.currentTime;
    // Lower thump
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 180,
      freqEnd: 40,
      startTime: t,
      duration: 0.2,
      gainPeak: 0.8,
      attack: 0.003,
      rampType: 'exponential',
    });
    playNoise(ctx, master, {
      startTime: t,
      duration: 0.12,
      filterType: 'bandpass',
      filterFreqStart: 2500,
      filterFreqEnd: 500,
      gainPeak: 0.5,
    });
    // Sharp metallic ring
    playTone(ctx, master, {
      type: 'triangle',
      freqStart: 1600,
      freqEnd: 800,
      startTime: t,
      duration: 0.22,
      gainPeak: 0.5,
      attack: 0.002,
    });
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 2400,
      freqEnd: 1200,
      startTime: t,
      duration: 0.16,
      gainPeak: 0.4,
      attack: 0.002,
    });
  },

  // weak: 弱点を突いた音。2音の上昇（例 880→1320Hz）
  weak: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 880,
      freqEnd: 880,
      startTime: t,
      duration: 0.08,
      gainPeak: 0.55,
      attack: 0.005,
    });
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 1320,
      freqEnd: 1320,
      startTime: t + 0.07,
      duration: 0.14,
      gainPeak: 0.6,
      attack: 0.005,
    });
  },

  // shield: 障壁で受けた音。鈍い金属音
  shield: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'triangle',
      freqStart: 280,
      freqEnd: 160,
      startTime: t,
      duration: 0.22,
      gainPeak: 0.7,
      attack: 0.003,
    });
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 440,
      freqEnd: 300,
      startTime: t,
      duration: 0.18,
      gainPeak: 0.45,
      attack: 0.003,
    });
    playNoise(ctx, master, {
      startTime: t,
      duration: 0.06,
      filterType: 'bandpass',
      filterFreqStart: 1800,
      filterFreqEnd: 800,
      gainPeak: 0.3,
    });
  },

  // heal: 回復。柔らかい三角波の3音アルペジオ
  heal: (ctx, master) => {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      playTone(ctx, master, {
        type: 'triangle',
        freqStart: freq,
        freqEnd: freq * 1.02,
        startTime: t + idx * 0.08,
        duration: 0.2,
        gainPeak: 0.5,
        attack: 0.02,
      });
    });
  },

  // buff: 上昇スイープ
  buff: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'triangle',
      freqStart: 260,
      freqEnd: 780,
      startTime: t,
      duration: 0.28,
      gainPeak: 0.55,
      attack: 0.01,
      rampType: 'exponential',
    });
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 520,
      freqEnd: 1560,
      startTime: t,
      duration: 0.28,
      gainPeak: 0.3,
      attack: 0.01,
      rampType: 'exponential',
    });
  },

  // debuff: 下降スイープ
  debuff: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sawtooth',
      freqStart: 600,
      freqEnd: 160,
      startTime: t,
      duration: 0.3,
      gainPeak: 0.4,
      attack: 0.01,
      rampType: 'exponential',
    });
  },

  // victory: 勝利の小ファンファーレ（4音アルペジオ）
  victory: (ctx, master) => {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const isLast = idx === notes.length - 1;
      playTone(ctx, master, {
        type: 'triangle',
        freqStart: freq,
        freqEnd: freq,
        startTime: t + idx * 0.09,
        duration: isLast ? 0.38 : 0.16,
        gainPeak: 0.55,
        attack: 0.01,
      });
    });
  },

  // defeat: 敗北。下降する4音
  defeat: (ctx, master) => {
    const t = ctx.currentTime;
    const notes = [311.13, 293.66, 261.63, 220.0]; // Eb4, D4, C4, A3
    notes.forEach((freq, idx) => {
      const isLast = idx === notes.length - 1;
      playTone(ctx, master, {
        type: 'sawtooth',
        freqStart: freq,
        freqEnd: freq * 0.95,
        startTime: t + idx * 0.11,
        duration: isLast ? 0.38 : 0.18,
        gainPeak: 0.35,
        attack: 0.01,
      });
    });
  },

  // reward: 報酬。きらめく高音2音
  reward: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 1046.5,
      freqEnd: 1046.5,
      startTime: t,
      duration: 0.12,
      gainPeak: 0.5,
      attack: 0.005,
    });
    playTone(ctx, master, {
      type: 'triangle',
      freqStart: 1567.98,
      freqEnd: 1567.98,
      startTime: t + 0.1,
      duration: 0.32,
      gainPeak: 0.5,
      attack: 0.005,
    });
  },

  // event: イベント決定の穏やかなチャイム
  event: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 587.33,
      freqEnd: 587.33,
      startTime: t,
      duration: 0.25,
      gainPeak: 0.45,
      attack: 0.01,
    });
    playTone(ctx, master, {
      type: 'sine',
      freqStart: 880,
      freqEnd: 880,
      startTime: t + 0.12,
      duration: 0.4,
      gainPeak: 0.45,
      attack: 0.01,
    });
  },

  // boss: ボス登場。低い太鼓2打
  boss: (ctx, master) => {
    const t = ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      playTone(ctx, master, {
        type: 'sine',
        freqStart: 90,
        freqEnd: 30,
        startTime: t + offset,
        duration: 0.18,
        gainPeak: 0.8,
        attack: 0.005,
        rampType: 'exponential',
      });
      playNoise(ctx, master, {
        startTime: t + offset,
        duration: 0.1,
        filterType: 'lowpass',
        filterFreqStart: 400,
        filterFreqEnd: 100,
        gainPeak: 0.5,
      });
    });
  },

  // leap: 次元跳躍。きらめきを伴う長い上昇スイープ
  leap: (ctx, master) => {
    const t = ctx.currentTime;
    playTone(ctx, master, {
      type: 'triangle',
      freqStart: 180,
      freqEnd: 1400,
      startTime: t,
      duration: 0.55,
      gainPeak: 0.6,
      attack: 0.02,
      rampType: 'exponential',
    });
    playNoise(ctx, master, {
      startTime: t + 0.08,
      duration: 0.45,
      filterType: 'bandpass',
      filterFreqStart: 800,
      filterFreqEnd: 4000,
      filterQ: 3.5,
      gainPeak: 0.35,
    });
  },

  // unlock: 実績解除のジングル
  unlock: (ctx, master) => {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const isLast = idx === notes.length - 1;
      playTone(ctx, master, {
        type: 'sine',
        freqStart: freq,
        freqEnd: freq,
        startTime: t + idx * 0.07,
        duration: isLast ? 0.32 : 0.14,
        gainPeak: 0.5,
        attack: 0.005,
      });
    });
  },
};

/**
 * Attempts to resume or initialize the AudioContext upon user interaction.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // silently guard against browser security exceptions
  }
}

/**
 * Plays a synthesized sound effect preset by name.
 * Safe to call at any time; will fail silently if muted, unsupported, or suspended.
 */
export function playSfx(name: SfxName): void {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  try {
    const synth = SFX_SYNTHESIZERS[name];
    if (synth) {
      synth(ctx, getMasterGain(ctx));
    }
  } catch {
    // silently guard against audio synthesis runtime failures
  }
}

/**
 * Test helper to reset internal singleton references.
 */
export function _resetAudioContextForTesting(): void {
  audioCtx = null;
  masterGain = null;
  noiseBuffer = null;
}
