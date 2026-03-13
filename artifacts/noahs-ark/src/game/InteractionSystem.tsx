import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function InteractionSystem() {
  const gameState = useGameStore((s) => s.gameState);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const buildArkSection = useGameStore((s) => s.buildArkSection);
  const coatWithPitch = useGameStore((s) => s.coatWithPitch);
  const player = useGameStore((s) => s.player);
  const ark = useGameStore((s) => s.ark);
  const world = useGameStore((s) => s.world);
  const gameOver = useGameStore((s) => s.gameOver);
  const updateHealth = useGameStore((s) => s.updateHealth);

  const checkVictory = useCallback(() => {
    if (ark.sectionsBuilt >= ark.totalSections &&
        ark.animalsBoarded >= ark.totalAnimals &&
        world.waterLevel > 5) {
      gameOver(true);
    }
  }, [ark, world.waterLevel, gameOver]);

  const checkDefeat = useCallback(() => {
    if (player.health <= 0) {
      gameOver(false);
    }
    if (world.waterLevel > 12 && ark.sectionsBuilt < ark.totalSections * 0.5) {
      gameOver(false);
    }
  }, [player.health, world.waterLevel, ark.sectionsBuilt, ark.totalSections, gameOver]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    checkVictory();
    checkDefeat();
  }, [gameState, checkVictory, checkDefeat]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (world.waterLevel > player.position[1] - 1) {
      const interval = setInterval(() => {
        updateHealth(-2);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, world.waterLevel, player.position, updateHealth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') resumeGame();
      }

      if (gameState !== 'playing') return;

      if (e.key === 'b' || e.key === 'B') {
        buildArkSection();
      }
      if (e.key === 'p' || e.key === 'P') {
        coatWithPitch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pauseGame, resumeGame, buildArkSection, coatWithPitch]);

  return null;
}
