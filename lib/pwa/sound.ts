'use client';

let audioContext: AudioContext | null = null;
let unlocked = false;
let ringing = false;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let activeNodes: Array<AudioNode | OscillatorNode> = [];
let wakeLock: WakeLockSentinel | null = null;

async function requestRingWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch {
    wakeLock = null;
  }
}

function releaseRingWakeLock() {
  if (!wakeLock) return;
  void wakeLock.release().catch(() => undefined);
  wakeLock = null;
}

export function unlockPartnerAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (!audioContext) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

function clearActiveNodes() {
  for (const node of activeNodes) {
    try {
      if ('stop' in node && typeof node.stop === 'function') {
        node.stop();
      }
      node.disconnect();
    } catch {
      // already stopped
    }
  }
  activeNodes = [];
}

function playToneBurst(ctx: AudioContext, startAt: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.03);
  gain.gain.setValueAtTime(0.22, startAt + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.55);
  gain.connect(ctx.destination);
  activeNodes.push(gain);

  const low = ctx.createOscillator();
  low.type = 'sine';
  low.frequency.setValueAtTime(740, startAt);
  low.connect(gain);
  low.start(startAt);
  low.stop(startAt + 0.55);
  activeNodes.push(low);

  const high = ctx.createOscillator();
  high.type = 'sine';
  high.frequency.setValueAtTime(988, startAt);
  high.connect(gain);
  high.start(startAt);
  high.stop(startAt + 0.55);
  activeNodes.push(high);
}

/** Classic double-ring burst used by the looping ringtone. */
function playRingCycle() {
  if (typeof window === 'undefined') return;
  unlockPartnerAudio();
  if (!audioContext) return;

  const ctx = audioContext;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  clearActiveNodes();
  const now = ctx.currentTime;
  playToneBurst(ctx, now);
  playToneBurst(ctx, now + 0.65);
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

function vibratePartnerRingPulse() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    // Double pulse, then pause — mirrors a phone ring cadence.
    navigator.vibrate([420, 160, 420, 900]);
  } catch {
    // Vibration not permitted
  }
}

export function isPartnerRinging() {
  return ringing;
}

/** Start a looping ringtone + vibration until stopPartnerRing(). */
export function startPartnerRing() {
  if (typeof window === 'undefined') return;
  stopPartnerRing();
  ringing = true;
  void requestRingWakeLock();

  const pulse = () => {
    if (!ringing) return;
    playRingCycle();
    vibratePartnerRingPulse();
  };

  pulse();
  ringTimer = setInterval(pulse, 2200);
}

export function stopPartnerRing() {
  ringing = false;
  if (ringTimer != null) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  clearActiveNodes();
  releaseRingWakeLock();
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
}
