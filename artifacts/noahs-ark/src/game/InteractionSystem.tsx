import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

const ARK_POSITION = [15, 0, -10];
const ARK_INTERACT_RANGE_SQ = 144; // 12^2

function isNearArk(): boolean {
  const { player } = useGameStore.getState();
  const dx = player.position[0] - ARK_POSITION[0];
  const dz = player.position[2] - ARK_POSITION[2];
  return dx * dx + dz * dz < ARK_INTERACT_RANGE_SQ;
}

export function InteractionSystem() {
  const gameState = useGameStore((s) => s.gameState);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const buildArkSection = useGameStore((s) => s.buildArkSection);
  const coatWithPitch = useGameStore((s) => s.coatWithPitch);
  const gameOver = useGameStore((s) => s.gameOver);
  const updateHealth = useGameStore((s) => s.updateHealth);
  const incrementDay = useGameStore((s) => s.incrementDay);

  // Victory/defeat checks — poll every 500ms instead of re-rendering every frame
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      const { player, ark, world } = useGameStore.getState();

      // Victory: ark complete, all animals boarded, water risen
      if (
        ark.sectionsBuilt >= ark.totalSections &&
        ark.animalsBoarded >= ark.totalAnimals &&
        world.waterLevel > 5
      ) {
        gameOver(true);
        return;
      }

      // Defeat: health depleted
      if (player.health <= 0) {
        gameOver(false);
        return;
      }

      // Defeat: water too high and ark less than half built
      if (world.waterLevel > 12 && ark.sectionsBuilt < ark.totalSections * 0.5) {
        gameOver(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState, gameOver]);

  // Drowning damage — 2 HP/sec when submerged
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      const { player, world } = useGameStore.getState();
      if (world.waterLevel > player.position[1] - 1) {
        updateHealth(-2);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, updateHealth]);

  // Day cycle — 1 day every 60 seconds
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      incrementDay();
    }, 60000);
    return () => clearInterval(interval);
  }, [gameState, incrementDay]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState === "playing") pauseGame();
        else if (gameState === "paused") resumeGame();
      }

      if (gameState !== "playing") return;

      if (e.key === "b" || e.key === "B") {
        if (isNearArk()) {
          buildArkSection();
        }
      }
      if (e.key === "p" || e.key === "P") {
        if (isNearArk()) {
          coatWithPitch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, pauseGame, resumeGame, buildArkSection, coatWithPitch]);

  return null;
}
