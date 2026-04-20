'use client';

import { useCallback, useRef } from 'react';

/**
 * Generates short audio tones via Web Audio API for scanner feedback.
 * No external files needed — pure oscillator synthesis.
 */
export function useScannerAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = 0.18;
        // Fade out to avoid click
        gain.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.7, duration * 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio not supported — silent fallback
      }
    },
    [getCtx],
  );

  /** Two-tone ascending beep: access granted */
  const playSuccess = useCallback(() => {
    playTone(880, 0.12, 'sine');
    setTimeout(() => playTone(1320, 0.18, 'sine'), 130);
  }, [playTone]);

  /** Single low tone: access denied */
  const playDenied = useCallback(() => {
    playTone(320, 0.3, 'square');
  }, [playTone]);

  return { playSuccess, playDenied };
}
