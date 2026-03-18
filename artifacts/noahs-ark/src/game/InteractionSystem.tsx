import { useEffect } from "react";
import { useGameStore, selectLocalPlayer, selectLocalArk } from "../store/gameStore";

export function InteractionSystem() {
  const gameState = useGameStore((s) => s.gameState);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const toggleBuildMenu = useGameStore((s) => s.toggleBuildMenu);
  const gameOver = useGameStore((s) => s.gameOver);
  const updateHealth = useGameStore((s) => s.updateHealth);
  const incrementDay = useGameStore((s) => s.incrementDay);
  const toggleScoreboard = useGameStore((s) => s.toggleScoreboard);
  const setShowDivineIntervention = useGameStore((s) => s.setShowDivineIntervention);
  const clearExpiredEffects = useGameStore((s) => s.clearExpiredEffects);
  const clearStaleLocks = useGameStore((s) => s.clearStaleLocks);

  // Victory/defeat checks — poll every 500ms
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const { world, players, arks, scores, matchConfig, localPlayerId } = state;

      const playerIds = Object.keys(players);

      for (const playerId of playerIds) {
        const player = players[playerId];
        const ark = arks[playerId];
        if (!player || !ark) continue;

        // Salvation Victory: ark complete + animals boarded + water > 5
        if (
          ark.sectionsBuilt >= ark.totalSections &&
          ark.animalsBoarded >= ark.totalAnimals &&
          world.waterLevel > 5
        ) {
          gameOver(true, playerId);
          return;
        }

        // Elimination: health = 0
        if (player.health <= 0) {
          if (playerId === localPlayerId) {
            // Local player eliminated — game over as defeat
            gameOver(false);
            return;
          }
          // Rivals are eliminated — remove them by zeroing health (already 0, no-op)
          // In a future system we could remove them from the player map
          continue;
        }

        // Too Late: water > 12 AND ark < 50%
        if (world.waterLevel > 12 && ark.sectionsBuilt < ark.totalSections * 0.5) {
          if (playerId === localPlayerId) {
            gameOver(false);
            return;
          }
        }
      }

      // Final Judgment: water > 15 — find player with highest score, declare winner
      if (world.waterLevel > 15) {
        let highestScore = -1;
        let highestScorerId = localPlayerId;
        for (const [id, score] of Object.entries(scores)) {
          if (score > highestScore) {
            highestScore = score;
            highestScorerId = id;
          }
        }
        gameOver(true, highestScorerId);
        return;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState, gameOver]);

  // Drowning damage — check ALL players, 2 HP/sec when submerged
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      const { players, world } = useGameStore.getState();
      for (const [playerId, player] of Object.entries(players)) {
        if (world.waterLevel > player.position[1] - 1) {
          updateHealth(-2, playerId);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, updateHealth]);

  // Clear expired active effects every 1000ms
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      clearExpiredEffects();
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, clearExpiredEffects]);

  // Clear stale resource node locks every 2 seconds
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      clearStaleLocks();
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState, clearStaleLocks]);

  // Day cycle — 1 day every 60 seconds
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      incrementDay();
    }, 60000);
    return () => clearInterval(interval);
  }, [gameState, incrementDay]);

  // Divine Intervention check — show panel when local faith >= 100 in versus mode
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (state.matchConfig.mode !== 'versus') return;
      const localPlayer = selectLocalPlayer(state);
      if (localPlayer && localPlayer.faith >= 100 && !state.showDivineIntervention) {
        setShowDivineIntervention(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [gameState, setShowDivineIntervention]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState === "playing") pauseGame();
        else if (gameState === "paused") resumeGame();
      }

      if (gameState !== "playing") return;

      if (e.key === "b" || e.key === "B") {
        toggleBuildMenu();
      }

      if (e.key === "Tab") {
        e.preventDefault();
        toggleScoreboard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, pauseGame, resumeGame, toggleBuildMenu, toggleScoreboard]);

  return null;
}
