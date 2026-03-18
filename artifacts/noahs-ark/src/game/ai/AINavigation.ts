import { getTerrainHeight } from '../Terrain';
import { resolveCollisions } from '../colliders';

const WORLD_BOUNDARY = 85;

/**
 * Calculate the next position when moving from `current` toward `target`.
 * Snaps Y to terrain height, applies collision resolution.
 */
export function moveToward(
  current: [number, number, number],
  target: [number, number, number],
  speed: number,
  delta: number,
): [number, number, number] {
  const dx = target[0] - current[0];
  const dz = target[2] - current[2];
  const distSq = dx * dx + dz * dz;

  if (distSq < 0.01) {
    // Already at target — just snap Y to terrain
    const y = getTerrainHeight(current[0], current[2]) + 1;
    return [current[0], y, current[2]];
  }

  const dist = Math.sqrt(distSq);
  const move = Math.min(speed * delta, dist);
  const nx = current[0] + (dx / dist) * move;
  const nz = current[2] + (dz / dist) * move;

  // Resolve against tree/rock colliders
  const [rx, rz] = resolveCollisions(nx, nz);

  // Clamp to world boundary
  const cx = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, rx));
  const cz = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, rz));

  const y = getTerrainHeight(cx, cz) + 1;
  return [cx, y, cz];
}

/**
 * Sample `candidates` random positions within `visionRadius` of `currentPos`
 * and return the one with highest elevation that is above `minElevation`.
 * Falls back to a raised version of currentPos if nothing qualifies.
 */
export function findArkPlacement(
  currentPos: [number, number, number],
  visionRadius: number,
): [number, number, number] {
  const MIN_ELEVATION = 5;
  const CANDIDATES = 20;

  let bestX = currentPos[0];
  let bestZ = currentPos[2];
  let bestElevation = -Infinity;

  for (let i = 0; i < CANDIDATES; i++) {
    // Random angle and radius
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * visionRadius;
    const cx = currentPos[0] + Math.cos(angle) * r;
    const cz = currentPos[2] + Math.sin(angle) * r;

    // Keep within world
    const bx = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, cx));
    const bz = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, cz));

    const elevation = getTerrainHeight(bx, bz);
    if (elevation >= MIN_ELEVATION && elevation > bestElevation) {
      bestElevation = elevation;
      bestX = bx;
      bestZ = bz;
    }
  }

  if (bestElevation === -Infinity) {
    // Nothing found above min elevation — walk toward higher ground near center
    // by sampling along direction toward origin
    const toOriginX = -currentPos[0];
    const toOriginZ = -currentPos[2];
    const len = Math.sqrt(toOriginX * toOriginX + toOriginZ * toOriginZ) || 1;
    const fallbackX = currentPos[0] + (toOriginX / len) * 20;
    const fallbackZ = currentPos[2] + (toOriginZ / len) * 20;
    const bx = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, fallbackX));
    const bz = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, fallbackZ));
    const y = getTerrainHeight(bx, bz);
    return [bx, y, bz];
  }

  const y = getTerrainHeight(bestX, bestZ);
  return [bestX, y, bestZ];
}

/**
 * Pick a random exploration target within `radius` units of `currentPos`.
 */
export function randomExploreTarget(
  currentPos: [number, number, number],
  radius: number,
): [number, number, number] {
  const minRadius = radius * 0.6;
  const angle = Math.random() * Math.PI * 2;
  const r = minRadius + Math.random() * (radius - minRadius);
  const tx = currentPos[0] + Math.cos(angle) * r;
  const tz = currentPos[2] + Math.sin(angle) * r;

  const bx = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, tx));
  const bz = Math.max(-WORLD_BOUNDARY, Math.min(WORLD_BOUNDARY, tz));
  const y = getTerrainHeight(bx, bz);
  return [bx, y, bz];
}
