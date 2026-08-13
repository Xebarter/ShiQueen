'use client';

let audioContext: AudioContext | null = null;
let unlocked = false;

export function unlockPartnerAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (!audioContext) {
      const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    unlocked = true;
  } catch {
    // Audio not available
  }
}

export function playPartnerChime() {
  if (typeof window === 'undefined') return;
  unlockPartnerAudio();
  if (!audioContext) return;

  const ctx = audioContext;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  gain.connect(ctx.destination);

  const first = ctx.createOscillator();
  first.type = 'sine';
  first.frequency.setValueAtTime(880, now);
  first.connect(gain);
  first.start(now);
  first.stop(now + 0.22);

  const second = ctx.createOscillator();
  second.type = 'sine';
  second.frequency.setValueAtTime(1174.7, now + 0.16);
  second.connect(gain);
  second.start(now + 0.16);
  second.stop(now + 0.55);

  void unlocked;
}

export function vibratePartnerAlert() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate([180, 80, 180, 80, 240]);
  } catch {
    // Vibration not permitted
  }
}
