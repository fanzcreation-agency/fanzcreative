import { useState, useEffect } from 'react';

/**
 * useSound — HTML5 Audio Asset Sound Manager
 * Loads and plays audio assets from /assets/sound/ directory.
 * Includes volume scaling, background theme cross-fading, and mute controls.
 */

let soundEnabled = true;  // master switch enabled by default
let musicEnabled = false; // ambient music off by default
let sfxEnabled = true;    // sfx sounds enabled by default

let ambientAudio = null;
let fadeInterval = null;

// Notify all mounted components when audio configuration changes
const dispatchAudioConfigChange = () => {
  window.dispatchEvent(
    new CustomEvent('audioconfigchange', {
      detail: { soundEnabled, musicEnabled, sfxEnabled },
    })
  );
};

// Fade helper for smooth volume transitions
function fadeAudio(audio, startVol, endVol, duration, onComplete) {
  if (fadeInterval) clearInterval(fadeInterval);

  const steps = 30;
  const stepTime = duration / steps;
  let step = 0;

  fadeInterval = setInterval(() => {
    step++;
    const vol = startVol + (endVol - startVol) * (step / steps);
    audio.volume = Math.max(0, Math.min(1, vol));

    if (step >= steps) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      if (onComplete) onComplete();
    }
  }, stepTime);
}

// Get current config
export function getAudioConfig() {
  return { soundEnabled, musicEnabled, sfxEnabled };
}

// Master toggle / config update function
export function setAudioConfig(newConfig) {
  if (newConfig.soundEnabled !== undefined) soundEnabled = newConfig.soundEnabled;
  if (newConfig.musicEnabled !== undefined) musicEnabled = newConfig.musicEnabled;
  if (newConfig.sfxEnabled !== undefined) sfxEnabled = newConfig.sfxEnabled;

  // Control ambient theme loop based on master and music config
  if (soundEnabled && musicEnabled) {
    playAmbient();
  } else {
    stopAmbient();
  }

  dispatchAudioConfigChange();
}

// Advanced custom hook to synchronize state across React components
export function useAudioConfig() {
  const [config, setConfig] = useState(getAudioConfig());

  useEffect(() => {
    const handle = (e) => {
      setConfig(e.detail);
    };
    window.addEventListener('audioconfigchange', handle);
    return () => window.removeEventListener('audioconfigchange', handle);
  }, []);

  const updateConfig = (newVal) => {
    setAudioConfig({ ...config, ...newVal });
  };

  return [config, updateConfig];
}

// Backward-compatible triggers for legacy component calls
export function toggleSound() {
  setAudioConfig({ soundEnabled: !soundEnabled });
  return soundEnabled;
}

export function isMuted() {
  return !soundEnabled;
}

export function useSoundState() {
  const [muted, setMuted] = useState(!soundEnabled);

  useEffect(() => {
    const handle = (e) => {
      setMuted(!e.detail.soundEnabled);
    };
    window.addEventListener('audioconfigchange', handle);
    return () => window.removeEventListener('audioconfigchange', handle);
  }, []);

  return [muted, toggleSound];
}

// Play SFX helper with custom volume and pooling (checks master and sfx sub-switch)
export function playSFX(filename, volume = 0.15) {
  if (!soundEnabled || !sfxEnabled) return;
  try {
    const audio = new Audio(`/assets/sound/${filename}`);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch (err) {
    console.error(`Error creating Audio for SFX: /assets/sound/${filename}`, err);
  }
}

/* ── Ambient Background Theme ────────────────────────────────────────── */
export function playAmbient() {
  if (!soundEnabled || !musicEnabled) return;
  try {
    if (!ambientAudio) {
      ambientAudio = new Audio('/assets/sound/ambient.ogg');
      ambientAudio.loop = true;
      ambientAudio.volume = 0;
    }
    ambientAudio.play().catch(() => {});
    fadeAudio(ambientAudio, ambientAudio.volume, 0.06, 1500); // Cinematic 1.5s fade-in
  } catch (err) {
    console.error('Error creating ambient audio:', err);
  }
}

export function stopAmbient() {
  if (!ambientAudio) return;
  try {
    fadeAudio(ambientAudio, ambientAudio.volume, 0, 1000, () => {
      ambientAudio.pause();
    });
  } catch (err) {
    console.error('Error stopping ambient audio:', err);
  }
}

/* ── Specific SFX Triggers ───────────────────────────────────────────── */

// Short clean button click
export function playClick() {
  playSFX('click.ogg', 0.15);
}

// High-frequency navigation link tick
export function playTick() {
  playSFX('tick.ogg', 0.12);
}

// Micro mouseover hover with a 60ms cursor-rest debounce to prevent rapid spam
let lastHoverTime = 0;
export function playHover() {
  const now = Date.now();
  if (now - lastHoverTime < 60) return;
  lastHoverTime = now;
  playSFX('hover.ogg', 0.10);
}

// Modal or slide menu close
export function playClose() {
  playSFX('close.ogg', 0.15);
}

// Heavy actions or loading states (e.g. form submission delay)
export function playLongClick() {
  playSFX('longclick.ogg', 0.18);
}

// Slider / Layout horizontal scroll transition
export function playList() {
  playSFX('list.ogg', 0.12);
}

// Page load reveal or smooth scroll glide
export function playSpiral() {
  playSFX('spiral.ogg', 0.15);
}

// Master state switch
export function playSwitch() {
  playSFX('switch.ogg', 0.15);
}

// Home link navigation reveal
export function playHomeLink() {
  playSFX('menu/homelink.ogg', 0.15);
}

// About link navigation reveal
export function playAboutLink() {
  playSFX('menu/aboutlink.ogg', 0.15);
}

// Sticker hovers for stack icons (legacy fallback)
export function playSmiley() {
  playHover();
}

/* ── Backward-compatible Aliases for Legacy Component Calls ──────────── */
export function playPop() {
  playClick(); // Map legacy pop to click.ogg
}

export function playSwoosh() {
  playClick(); // Map legacy FAQ swoosh to click.ogg
}

export function playTap() {
  playTick(); // Map legacy service tap to tick.ogg
}

export function playWhoosh() {
  playSpiral(); // Map legacy mobile open to spiral.ogg
}

