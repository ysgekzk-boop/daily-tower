import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isSfxMuted,
  setSfxMuted,
  playSfx,
  unlockAudio,
  SfxName,
  SFX_STORAGE_KEY,
  _resetAudioContextForTesting,
} from '../src/utils/sound';

describe('Sound Effect Module (src/utils/sound.ts)', () => {
  let store: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };

  beforeEach(() => {
    store = {};
    _resetAudioContextForTesting();
    vi.restoreAllMocks();
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      AudioContext: undefined,
    });
  });

  afterEach(() => {
    _resetAudioContextForTesting();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Mute state persistence', () => {
    it('defaults to unmuted when localStorage has no entry', () => {
      expect(isSfxMuted()).toBe(false);
    });

    it('persists mute = true into localStorage with value "1"', () => {
      setSfxMuted(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(SFX_STORAGE_KEY, '1');
      expect(isSfxMuted()).toBe(true);
    });

    it('persists mute = false into localStorage with value "0"', () => {
      setSfxMuted(true);
      expect(isSfxMuted()).toBe(true);
      setSfxMuted(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(SFX_STORAGE_KEY, '0');
      expect(isSfxMuted()).toBe(false);
    });
  });

  describe('Graceful degradation without AudioContext', () => {
    it('safely handles unlockAudio without AudioContext defined', () => {
      expect(() => unlockAudio()).not.toThrow();
    });

    it('safely calls playSfx for all 16 presets without throwing', () => {
      const allPresets: SfxName[] = [
        'click',
        'attack',
        'hit',
        'critical',
        'weak',
        'shield',
        'heal',
        'buff',
        'debuff',
        'victory',
        'defeat',
        'reward',
        'event',
        'boss',
        'leap',
        'unlock',
      ];

      expect(allPresets).toHaveLength(16);

      for (const name of allPresets) {
        expect(() => playSfx(name)).not.toThrow();
      }
    });

    it('early-returns when muted without accessing audio context', () => {
      setSfxMuted(true);
      const audioContextSpy = vi.fn();
      vi.stubGlobal('window', {
        localStorage: mockLocalStorage,
        AudioContext: audioContextSpy,
      });

      playSfx('click');
      expect(audioContextSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mocked Web Audio synthesis', () => {
    it('synthesizes sounds via AudioContext when available', () => {
      setSfxMuted(false);

      const mockParam = {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };

      const mockGainNode = {
        gain: { ...mockParam },
        connect: vi.fn(),
        context: null as unknown,
      };

      const mockOscillator = {
        type: 'sine',
        frequency: { ...mockParam },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      const mockFilter = {
        type: 'lowpass',
        frequency: { ...mockParam },
        Q: { ...mockParam },
        connect: vi.fn(),
      };

      const mockSource = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      const mockAudioBuffer = {
        sampleRate: 44100,
        getChannelData: vi.fn(() => new Float32Array(44100)),
      };

      class MockAudioContext {
        currentTime = 0;
        sampleRate = 44100;
        state = 'running';
        destination = {};

        createGain = vi.fn(() => ({ ...mockGainNode, context: this }));
        createOscillator = vi.fn(() => ({ ...mockOscillator }));
        createBiquadFilter = vi.fn(() => ({ ...mockFilter }));
        createBufferSource = vi.fn(() => ({ ...mockSource }));
        createBuffer = vi.fn(() => mockAudioBuffer);
        resume = vi.fn().mockResolvedValue(undefined);
      }

      vi.stubGlobal('window', {
        localStorage: mockLocalStorage,
        AudioContext: MockAudioContext,
      });

      const allPresets: SfxName[] = [
        'click',
        'attack',
        'hit',
        'critical',
        'weak',
        'shield',
        'heal',
        'buff',
        'debuff',
        'victory',
        'defeat',
        'reward',
        'event',
        'boss',
        'leap',
        'unlock',
      ];

      for (const name of allPresets) {
        expect(() => playSfx(name)).not.toThrow();
      }
    });

    it('unlockAudio calls resume if context is suspended', () => {
      const mockResume = vi.fn().mockResolvedValue(undefined);
      class SuspendedMockContext {
        currentTime = 0;
        sampleRate = 44100;
        state = 'suspended';
        destination = {};
        resume = mockResume;
      }

      vi.stubGlobal('window', {
        localStorage: mockLocalStorage,
        AudioContext: SuspendedMockContext,
      });

      unlockAudio();
      expect(mockResume).toHaveBeenCalled();
    });
  });
});
