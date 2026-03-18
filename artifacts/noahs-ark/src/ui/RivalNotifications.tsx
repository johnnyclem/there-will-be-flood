import { useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '../store/gameStore';

export function RivalNotifications() {
  const gameState = useGameStore((s) => s.gameState);
  const matchMode = useGameStore((s) => s.matchConfig.mode);

  // Track previous state to detect changes
  const prevStateRef = useRef<{
    rivalSections: number;
    rivalAnimals: number;
    rivalPitch: number;
    rivalEffects: number;
  } | null>(null);

  useEffect(() => {
    if (gameState !== 'playing' || matchMode !== 'versus') return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const localId = state.localPlayerId;

      // Find rival player(s)
      for (const [playerId, player] of Object.entries(state.players)) {
        if (playerId === localId || !player.isAI) continue;

        const ark = state.arks[playerId];
        if (!ark) continue;

        const current = {
          rivalSections: ark.sectionsBuilt,
          rivalAnimals: ark.animalsBoarded,
          rivalPitch: ark.pitchCoated,
          rivalEffects: player.activeEffects.length,
        };

        const prev = prevStateRef.current;
        if (prev) {
          if (current.rivalSections > prev.rivalSections) {
            const diff = current.rivalSections - prev.rivalSections;
            toast(`${player.name} built ${diff} ark section${diff > 1 ? 's' : ''}`, {
              duration: 3000,
              style: { background: '#2a1a1a', color: '#e74c3c', border: '1px solid #c0392b', fontFamily: 'Georgia, serif' },
            });
          }

          if (current.rivalAnimals > prev.rivalAnimals) {
            // Find which species was just boarded
            const newAnimalIds = ark.boardedAnimalIds.slice(prev.rivalAnimals);
            for (const aid of newAnimalIds) {
              const animal = state.animalStates.find((a) => a.id === aid);
              if (animal) {
                toast(`${player.name} boarded a ${animal.species}!`, {
                  duration: 3000,
                  style: { background: '#2a1a1a', color: '#e67e22', border: '1px solid #d35400', fontFamily: 'Georgia, serif' },
                });
              }
            }
          }

          if (current.rivalPitch > prev.rivalPitch) {
            toast(`${player.name} coated ark with pitch`, {
              duration: 2000,
              style: { background: '#2a1a1a', color: '#95a5a6', border: '1px solid #7f8c8d', fontFamily: 'Georgia, serif' },
            });
          }

          if (current.rivalEffects > prev.rivalEffects) {
            const latest = player.activeEffects[player.activeEffects.length - 1];
            if (latest) {
              const powerNames: Record<string, string> = {
                revelation: 'Revelation',
                speed_blessing: 'Speed Blessing',
                plague_of_locusts: 'Plague of Locusts',
              };
              const name = powerNames[latest.type] || latest.type;
              const isTargetingUs = latest.targetPlayerId === localId;
              toast(
                isTargetingUs
                  ? `${player.name} used ${name} against you!`
                  : `${player.name} invoked ${name}!`,
                {
                  duration: 4000,
                  style: {
                    background: isTargetingUs ? '#3a1a2a' : '#1a1a3a',
                    color: isTargetingUs ? '#e74c3c' : '#9b59b6',
                    border: `1px solid ${isTargetingUs ? '#c0392b' : '#8e44ad'}`,
                    fontFamily: 'Georgia, serif',
                  },
                },
              );
            }
          }
        }

        prevStateRef.current = current;
      }
    }, 500);

    return () => {
      clearInterval(interval);
      prevStateRef.current = null;
    };
  }, [gameState, matchMode]);

  if (matchMode !== 'versus') return null;

  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      toastOptions={{
        style: {
          fontSize: '14px',
          letterSpacing: '0.5px',
        },
      }}
    />
  );
}
