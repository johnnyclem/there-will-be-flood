/**
 * narration.ts — God speaks to Noah via ElevenLabs TTS.
 *
 * All functions are non-blocking: if the API is unavailable the game
 * continues normally.  speak() resolves immediately on any error so
 * callers can safely await it without hanging.
 */

/** Simple cache key: first 50 chars + total length */
function cacheKey(text: string): string {
  return `${text.slice(0, 50)}::${text.length}`;
}

const audioCache = new Map<string, string>();

let currentAudio: HTMLAudioElement | null = null;

/** Fetch TTS audio and return a blob URL, or null on failure. */
async function fetchAndCache(text: string): Promise<string | null> {
  const key = cacheKey(text);
  const cached = audioCache.get(key);
  if (cached) return cached;

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.warn(`[narration] TTS request failed: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    audioCache.set(key, url);
    return url;
  } catch (err) {
    console.warn('[narration] TTS fetch error (API may be offline):', err);
    return null;
  }
}

/**
 * Speak the given text aloud.
 * Resolves when audio finishes (or immediately if unavailable/error).
 */
export async function speak(text: string): Promise<void> {
  // Stop anything currently playing before starting a new clip.
  stopSpeaking();

  try {
    const url = await fetchAndCache(text);
    if (!url) return;

    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.volume = 0.7;
      currentAudio = audio;

      audio.addEventListener('ended', () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      });

      audio.addEventListener('error', (e) => {
        console.warn('[narration] Audio playback error:', e);
        if (currentAudio === audio) currentAudio = null;
        resolve();
      });

      audio.play().catch((err) => {
        console.warn('[narration] audio.play() rejected:', err);
        if (currentAudio === audio) currentAudio = null;
        resolve();
      });
    });
  } catch (err) {
    console.warn('[narration] speak() unexpected error:', err);
  }
}

/** Stop any currently playing narration audio immediately. */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Warm the cache by pre-fetching TTS for all supplied texts, staggered
 * to avoid rate-limiting. Fire-and-forget — callers should NOT await this.
 */
export function preload(texts: string[]): void {
  texts.forEach((text, i) => {
    setTimeout(() => {
      fetchAndCache(text).catch(() => {});
    }, i * 1500); // 1.5 s between requests
  });
}
