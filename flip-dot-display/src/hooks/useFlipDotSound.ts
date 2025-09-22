'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
}

class FlipDotSoundManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private lastPlayTime = 0;
  private playCount = 0;
  private throttleWindow = 50; // ms

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private createFlipDotSound(baseFrequency: number = 1000, volume: number = 0.3, variation: number = 0): void {
    if (!this.audioContext || !this.initialized) return;

    const now = this.audioContext.currentTime;
    const duration = 0.08; // Longer duration for more realistic sound

    // Create noise source for mechanical texture
    const bufferSize = this.audioContext.sampleRate * duration;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate filtered noise for mechanical sound
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Create resonant filter for body
    const bodyFilter = this.audioContext.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(baseFrequency, now);
    bodyFilter.Q.setValueAtTime(3, now);

    // Create high-frequency filter for the initial "snap"
    const snapOscillator = this.audioContext.createOscillator();
    const snapFilter = this.audioContext.createBiquadFilter();
    snapFilter.type = 'lowpass';
    snapFilter.frequency.setValueAtTime(2000, now);
    snapFilter.Q.setValueAtTime(1, now);

    snapOscillator.type = 'triangle';
    snapOscillator.frequency.setValueAtTime(baseFrequency * 2, now);

    // Frequency sweep downward for mechanical settling
    snapOscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 0.7, now + 0.02);

    // Main gain envelope
    const mainGain = this.audioContext.createGain();
    const snapGain = this.audioContext.createGain();

    // Softer attack, longer decay for mechanical feel
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.005); // Softer attack
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);
    mainGain.gain.linearRampToValueAtTime(0, now + duration);

    // Sharp initial snap that fades quickly
    snapGain.gain.setValueAtTime(0, now);
    snapGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.001);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);
    snapGain.gain.linearRampToValueAtTime(0, now + 0.02);

    // Connect noise path (main body of sound)
    noiseSource.connect(bodyFilter);
    bodyFilter.connect(mainGain);
    mainGain.connect(this.audioContext.destination);

    // Connect snap path (initial electromagnetic pulse)
    snapOscillator.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.audioContext.destination);

    // Start and stop
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    snapOscillator.start(now);
    snapOscillator.stop(now + 0.02);

    // Clean up
    noiseSource.onended = () => {
      noiseSource.disconnect();
      bodyFilter.disconnect();
      mainGain.disconnect();
    };

    snapOscillator.onended = () => {
      snapOscillator.disconnect();
      snapFilter.disconnect();
      snapGain.disconnect();
    };
  }

  public playFlipSound(volume: number = 50, enabled: boolean = true): void {
    if (!enabled || !this.initialized) return;

    const now = Date.now();

    // Throttle sounds to prevent overwhelming
    if (now - this.lastPlayTime < 5) {
      this.playCount++;
      if (this.playCount > 20) {
        // Too many sounds at once, skip some
        if (Math.random() > 0.3) return;
      }
    } else {
      this.playCount = 0;
    }

    this.lastPlayTime = now;

    // Resume audio context if suspended (happens on some browsers)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create variations for natural sound
    const soundVariations = [
      { frequency: 800, variation: 0 },   // Low thud
      { frequency: 1200, variation: 1 },  // Mid snick
      { frequency: 950, variation: 2 },   // Slightly higher
      { frequency: 1100, variation: 3 },  // Balanced
    ];

    const selectedVariation = soundVariations[Math.floor(Math.random() * soundVariations.length)];

    // Add pitch variation (±15%)
    const pitchVariation = (Math.random() - 0.5) * 0.3;
    const frequency = selectedVariation.frequency * (1 + pitchVariation);

    // Convert volume from 0-100 to 0-0.4 range (softer than before)
    const audioVolume = (volume / 100) * 0.4;

    this.createFlipDotSound(frequency, audioVolume, selectedVariation.variation);
  }

  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.initialized = false;
    }
  }
}

export function useFlipDotSound() {
  const soundManagerRef = useRef<FlipDotSoundManager | null>(null);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flipDotSoundSettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return { enabled: true, volume: 30 };
  });

  useEffect(() => {
    soundManagerRef.current = new FlipDotSoundManager();

    return () => {
      soundManagerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flipDotSoundSettings', JSON.stringify(soundSettings));
    }
  }, [soundSettings]);

  const playSound = useCallback(() => {
    soundManagerRef.current?.playFlipSound(soundSettings.volume, soundSettings.enabled);
  }, [soundSettings]);

  const setVolume = useCallback((volume: number) => {
    setSoundSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(100, volume)) }));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setSoundSettings(prev => ({ ...prev, enabled }));
  }, []);

  return {
    playSound,
    soundSettings,
    setVolume,
    toggleSound,
    setEnabled
  };
}