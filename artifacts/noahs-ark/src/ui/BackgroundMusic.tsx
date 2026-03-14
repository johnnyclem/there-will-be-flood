import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const gameState = useGameStore((s) => s.gameState);

  useEffect(() => {
    const audio = new Audio('/background-music.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (gameState === 'playing') {
      audio.play().catch(() => {});
    } else if (gameState === 'paused') {
      audio.pause();
    }
  }, [gameState]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <button
      onClick={() => setMuted((m) => !m)}
      title={muted ? 'Unmute music' : 'Mute music'}
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        marginTop: '160px',
        width: '36px',
        height: '36px',
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  );
}
