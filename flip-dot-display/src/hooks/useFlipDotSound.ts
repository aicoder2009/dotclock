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

  private createClickSound(frequency: number = 4000, volume: number = 0.3): void {
    if (!this.audioContext || !this.initialized) return;

    const now = this.audioContext.currentTime;

    // Create oscillator for the click
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Configure the click sound
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);

    // Add filter for more realistic mechanical sound
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.setValueAtTime(10, now);

    // Configure envelope for sharp click
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.015);

    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.02);

    // Clean up
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gainNode.disconnect();
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

    // Add slight randomization to frequency for natural variation
    const baseFrequency = 4000;
    const frequencyVariation = (Math.random() - 0.5) * 800;
    const frequency = baseFrequency + frequencyVariation;

    // Convert volume from 0-100 to 0-0.5 range (to prevent being too loud)
    const audioVolume = (volume / 100) * 0.5;

    this.createClickSound(frequency, audioVolume);
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