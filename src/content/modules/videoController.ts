import { state } from './state';

// ─── Video Pause/Resume Helpers ─────────────────────────────────────────────

interface VideoSnapshot {
  video: HTMLVideoElement;
  wasMuted: boolean;
  wasPlaying: boolean;
  savedTime: number;
}

let videoSnapshots: VideoSnapshot[] = [];
let gatePauseObserver: MutationObserver | null = null;

/** Handler attached to each <video> — re-pauses if the gate is still open */
function onVideoPlay(this: HTMLVideoElement) {
  if (!state.gateIsOpen) return;
  try {
    this.muted = true;
    this.pause();
  } catch (_) {}
}

/** Mute, pause, and attach a play-guard listener to a video */
export function safelyPauseVideo(v: HTMLVideoElement) {
  try {
    v.muted = true;
    v.pause();
  } catch (_) {}
  v.removeEventListener('play', onVideoPlay);
  v.addEventListener('play', onVideoPlay);
}

/** Remove the play-guard listener from a video */
export function removePlayGuard(v: HTMLVideoElement) {
  v.removeEventListener('play', onVideoPlay);
}

/** Snapshot all current videos, mute them and pause */
export function snapshotAndPauseAll() {
  videoSnapshots = [];
  document.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
    videoSnapshots.push({
      video: v,
      wasMuted: v.muted,
      wasPlaying: !v.paused,
      savedTime: v.currentTime,
    });
    safelyPauseVideo(v);
  });
}

/** Pause any newly-inserted <video> elements while the gate is open */
export function startGatePauseObserver() {
  if (gatePauseObserver) return;
  gatePauseObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.tagName === 'VIDEO') {
          safelyPauseVideo(node as HTMLVideoElement);
        }
        node.querySelectorAll<HTMLVideoElement>('video').forEach(safelyPauseVideo);
      });
    }
  });
  gatePauseObserver.observe(document.documentElement, { childList: true, subtree: true });
}

export function stopGatePauseObserver() {
  if (gatePauseObserver) {
    gatePauseObserver.disconnect();
    gatePauseObserver = null;
  }
}

/** Restore videos to their pre-gate state */
export function restoreVideos() {
  for (const snap of videoSnapshots) {
    try {
      const v = snap.video;
      removePlayGuard(v);
      if (!document.contains(v)) continue;
      v.muted = snap.wasMuted;
      if (snap.wasPlaying) {
        if (Math.abs(v.currentTime - snap.savedTime) > 1) {
          v.currentTime = snap.savedTime;
        }
        v.play().catch(() => {});
      }
    } catch (_) {}
  }
  videoSnapshots = [];
  document.querySelectorAll<HTMLVideoElement>('video').forEach(removePlayGuard);
}
