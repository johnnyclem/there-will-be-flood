import { mulberry32 } from '../utils/rng';
import { getTerrainHeight } from '../game/Terrain';
import type { ResourceNode, AnimalState, MatchConfig } from './gameStore';

const SPECIES = [
  { name: 'Lion', color: '#C4A35A', size: [0.8, 0.5, 1.2] as [number, number, number] },
  { name: 'Elephant', color: '#888888', size: [1.4, 1.0, 1.8] as [number, number, number] },
  { name: 'Dove', color: '#DDDDDD', size: [0.25, 0.2, 0.3] as [number, number, number] },
  { name: 'Horse', color: '#8B4513', size: [0.7, 0.6, 1.2] as [number, number, number] },
  { name: 'Sheep', color: '#F5F5DC', size: [0.5, 0.4, 0.7] as [number, number, number] },
  { name: 'Wolf', color: '#5C5C5C', size: [0.6, 0.4, 0.9] as [number, number, number] },
  { name: 'Bear', color: '#4A3728', size: [0.9, 0.7, 1.1] as [number, number, number] },
];

export { SPECIES };

/** Number of players for a given match config */
function playerCount(config: MatchConfig): number {
  return config.mode === 'versus' ? 2 : 1;
}

/** Generate resource nodes scaled by player count */
export function generateResourceNodes(config: MatchConfig): ResourceNode[] {
  const result: ResourceNode[] = [];
  const rng = mulberry32(54321);
  let id = 0;
  const scale = config.mode === 'versus' ? 1.6 : 1.0;

  // Wood
  const woodCount = Math.round(50 * scale);
  for (let i = 0; i < woodCount; i++) {
    const x = (rng() - 0.5) * 140;
    const z = (rng() - 0.5) * 140;
    const y = getTerrainHeight(x, z);
    if (y < -1) continue;
    result.push({
      id: id++,
      position: [x, y + 0.7, z],
      type: 'wood',
      amount: 5 + Math.floor(rng() * 6),
      maxAmount: 10,
      lockedBy: null,
      lockedUntil: 0,
    });
  }

  // Pitch
  const pitchCount = Math.round(15 * scale);
  for (let i = 0; i < pitchCount; i++) {
    const x = (rng() - 0.5) * 140;
    const z = (rng() - 0.5) * 140;
    const y = getTerrainHeight(x, z);
    if (y < -1) continue;
    result.push({
      id: id++,
      position: [x, y + 0.3, z],
      type: 'pitch',
      amount: 2 + Math.floor(rng() * 3),
      maxAmount: 5,
      lockedBy: null,
      lockedUntil: 0,
    });
  }

  // Food
  const foodCount = Math.round(20 * scale);
  for (let i = 0; i < foodCount; i++) {
    const x = (rng() - 0.5) * 120;
    const z = (rng() - 0.5) * 120;
    const y = getTerrainHeight(x, z);
    if (y < -1) continue;
    result.push({
      id: id++,
      position: [x, y + 0.3, z],
      type: 'food',
      amount: 2 + Math.floor(rng() * 4),
      maxAmount: 6,
      lockedBy: null,
      lockedUntil: 0,
    });
  }

  // Gopher Wood (high elevation only)
  const gopherCount = Math.round(8 * scale);
  for (let i = 0; i < gopherCount; i++) {
    const x = (rng() - 0.5) * 160;
    const z = (rng() - 0.5) * 160;
    const y = getTerrainHeight(x, z);
    if (y < 3) continue;
    result.push({
      id: id++,
      position: [x, y + 0.9, z],
      type: 'gopherWood',
      amount: 1 + Math.floor(rng() * 2),
      maxAmount: 3,
      lockedBy: null,
      lockedUntil: 0,
    });
  }

  return result;
}

/** Generate animal states scaled by player count */
export function generateAnimalStates(config: MatchConfig): AnimalState[] {
  const result: AnimalState[] = [];
  const rng = mulberry32(99999);
  let id = 0;

  // Solo: 2 per species (14 total). Versus: 3 per species (21 total)
  const perSpecies = config.mode === 'versus' ? 3 : 2;

  for (const species of SPECIES) {
    for (let pair = 0; pair < perSpecies; pair++) {
      const angle = rng() * Math.PI * 2;
      const dist = 20 + rng() * 50;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      result.push({
        id: id++,
        species: species.name,
        color: species.color,
        size: species.size,
        position: [x, y + species.size[1] / 2, z],
        startPosition: [x, 0, z],
        wanderRadius: 8 + rng() * 12,
        speed: 1 + rng() * 2,
        paired: pair > 0,
        followingPlayerId: null,
        boardedByPlayerId: null,
      });
    }
  }

  return result;
}

/** Get spawn position for a player index (opposite sides of map) */
export function getSpawnPosition(playerIndex: number, totalPlayers: number): [number, number, number] {
  const radius = 40;
  const angle = (playerIndex / totalPlayers) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = getTerrainHeight(x, z) + 1;
  return [x, y, z];
}

/** Player colors */
export const PLAYER_COLORS = ['#8B6914', '#C0392B', '#2980B9', '#27AE60'];
export const PLAYER_NAMES = ['Noah', 'Shem', 'Ham', 'Japheth'];
