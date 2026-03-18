import { getTerrainHeight } from './Terrain';
import { useGameStore } from '../store/gameStore';

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

export interface BoxCollider {
  x: number;
  z: number;
  halfWidth: number; // half-extent along X
  halfDepth: number; // half-extent along Z
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate tree colliders using the same seed/logic as Trees.tsx
function generateTreeColliders(): CircleCollider[] {
  const colliders: CircleCollider[] = [];
  const rng = mulberry32(12345);

  for (let i = 0; i < 200; i++) {
    const x = (rng() - 0.5) * 160;
    const z = (rng() - 0.5) * 160;
    const dist = Math.sqrt(x * x + z * z);

    if (dist < 12) continue;

    const y = getTerrainHeight(x, z);
    if (y < -1) continue;

    const types = ['pine', 'oak', 'bush'] as const;
    const type = types[Math.floor(rng() * 3)];
    const scale = 0.8 + rng() * 0.6;
    // consume the remaining rng calls to stay in sync
    rng(); // trunkHeight
    rng(); // canopySize

    // Collision radius based on tree type and scale
    let radius: number;
    if (type === 'bush') {
      radius = 0.8; // bushes are shorter/wider
    } else if (type === 'pine') {
      radius = 0.4 * scale;
    } else {
      radius = 0.5 * scale; // oak
    }

    colliders.push({ x, z, radius });
  }

  return colliders;
}

// Generate rock colliders using the same seed/logic as Trees.tsx
function generateRockColliders(): CircleCollider[] {
  const colliders: CircleCollider[] = [];
  const rng = mulberry32(67890);

  for (let i = 0; i < 80; i++) {
    const x = (rng() - 0.5) * 160;
    const z = (rng() - 0.5) * 160;
    const y = getTerrainHeight(x, z);

    if (y < -1) continue;

    const scaleX = 0.3 + rng() * 0.8;
    rng(); // scaleY (not needed for 2D collision)
    const scaleZ = 0.3 + rng() * 0.8;
    rng(); // rotation

    // Use the average of X and Z scales as radius
    const radius = (scaleX + scaleZ) / 2;
    colliders.push({ x, z, radius });
  }

  return colliders;
}

// Ark collider dimensions
const ARK_HALF_WIDTH = 9;  // ARK_LENGTH / 2
const ARK_HALF_DEPTH = 2.5; // ARK_WIDTH / 2

// Pre-compute all colliders at module load
const treeColliders = generateTreeColliders();
const rockColliders = generateRockColliders();
const allCircleColliders = [...treeColliders, ...rockColliders];

/**
 * Resolve player position against all colliders.
 * Returns the corrected [x, z] position.
 */
export function resolveCollisions(px: number, pz: number, playerRadius: number = 0.5): [number, number] {
  let x = px;
  let z = pz;

  // Check circle colliders (trees + rocks)
  for (const c of allCircleColliders) {
    const dx = x - c.x;
    const dz = z - c.z;
    const distSq = dx * dx + dz * dz;
    const minDist = c.radius + playerRadius;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const overlap = minDist - dist;
      // Push player out along the collision normal
      x += (dx / dist) * overlap;
      z += (dz / dist) * overlap;
    }
  }

  // Check ark box collider (AABB) — only if placed
  const arkPos = useGameStore.getState().ark.position;
  if (arkPos) {
    const arkMinX = arkPos[0] - ARK_HALF_WIDTH - playerRadius;
    const arkMaxX = arkPos[0] + ARK_HALF_WIDTH + playerRadius;
    const arkMinZ = arkPos[2] - ARK_HALF_DEPTH - playerRadius;
    const arkMaxZ = arkPos[2] + ARK_HALF_DEPTH + playerRadius;

    if (x > arkMinX && x < arkMaxX && z > arkMinZ && z < arkMaxZ) {
      const overlapLeft = x - arkMinX;
      const overlapRight = arkMaxX - x;
      const overlapBack = z - arkMinZ;
      const overlapFront = arkMaxZ - z;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapBack, overlapFront);

      if (minOverlap === overlapLeft) x = arkMinX;
      else if (minOverlap === overlapRight) x = arkMaxX;
      else if (minOverlap === overlapBack) z = arkMinZ;
      else z = arkMaxZ;
    }
  }

  return [x, z];
}
