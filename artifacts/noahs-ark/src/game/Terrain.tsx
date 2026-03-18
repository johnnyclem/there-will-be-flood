import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 200;
const TERRAIN_HEIGHT = 15;

// Module-level noise instances — shared by both Terrain mesh and getTerrainHeight
const noise2D = createNoise2D(() => 0.42);
// Second noise for color variation (different seed)
const colorNoise = createNoise2D(() => 0.73);

// Smoothstep for nice transitions
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Lerp colors
function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number
): [number, number, number] {
  return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t];
}

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      const dist = Math.sqrt(x * x + z * z);
      const valleyFactor = Math.min(1, dist / 60);

      let height = 0;
      height += noise2D(x * 0.02, z * 0.02) * TERRAIN_HEIGHT;
      height += noise2D(x * 0.05, z * 0.05) * 4;
      height += noise2D(x * 0.1, z * 0.1) * 1.5;
      // Extra detail octaves
      height += noise2D(x * 0.2, z * 0.2) * 0.6;
      height += noise2D(x * 0.4, z * 0.4) * 0.2;
      height *= valleyFactor;

      const centerPlateau = Math.max(0, 1 - dist / 15) * 3;
      height = Math.max(height, centerPlateau);

      positions.setZ(i, height);

      // Color variation noise (independent of height)
      const cVar = colorNoise(x * 0.06, z * 0.06) * 0.5 + 0.5; // 0..1
      const cDetail = colorNoise(x * 0.15, z * 0.15) * 0.08; // subtle micro-variation

      const normalizedHeight = (height + 2) / (TERRAIN_HEIGHT + 2);

      let r: number, g: number, b: number;

      if (normalizedHeight < 0.05) {
        // Sandy shore / water edge
        [r, g, b] = [0.76 + cDetail, 0.7 + cDetail, 0.5 + cDetail];
      } else if (normalizedHeight < 0.15) {
        // Transition: sand to grass
        const t = smoothstep(0.05, 0.15, normalizedHeight);
        const sand: [number, number, number] = [0.76, 0.7, 0.5];
        const grass: [number, number, number] = [0.28, 0.52, 0.18];
        [r, g, b] = lerpColor(...sand, ...grass, t);
        r += cDetail; g += cDetail; b += cDetail;
      } else if (normalizedHeight < 0.35) {
        // Lush lowland grass with variation
        const patchiness = cVar;
        if (patchiness > 0.65) {
          // Darker grass patches
          [r, g, b] = [0.22 + cDetail, 0.45 + cDetail, 0.15 + cDetail];
        } else if (patchiness < 0.3) {
          // Slight dirt/dry patches
          [r, g, b] = [0.42 + cDetail, 0.48 + cDetail, 0.25 + cDetail];
        } else {
          [r, g, b] = [0.28 + cDetail, 0.55 + normalizedHeight * 0.2 + cDetail, 0.18 + cDetail];
        }
      } else if (normalizedHeight < 0.55) {
        // Mid-elevation: darker forest-floor green
        const t = smoothstep(0.35, 0.55, normalizedHeight);
        const lush: [number, number, number] = [0.25, 0.48, 0.18];
        const dark: [number, number, number] = [0.3, 0.4, 0.22];
        [r, g, b] = lerpColor(...lush, ...dark, t);
        r += cDetail; g += cDetail; b += cDetail;
      } else if (normalizedHeight < 0.75) {
        // Transition: green to rocky
        const t = smoothstep(0.55, 0.75, normalizedHeight);
        const green: [number, number, number] = [0.32, 0.4, 0.24];
        const rock: [number, number, number] = [0.55, 0.5, 0.42];
        [r, g, b] = lerpColor(...green, ...rock, t);
        r += cDetail * 1.5; g += cDetail; b += cDetail;
      } else {
        // High rocky terrain with slight grey-tan variation
        const rockVar = cVar * 0.12;
        [r, g, b] = [0.55 + rockVar + cDetail, 0.5 + rockVar * 0.8 + cDetail, 0.42 + rockVar * 0.5 + cDetail];
      }

      colors[i * 3] = Math.max(0, Math.min(1, r));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.85} />
    </mesh>
  );
}

// Expose for testing in development
if (typeof window !== 'undefined') {
  (window as any).__getTerrainHeight__ = getTerrainHeight;
  (window as any).__noise2D__ = noise2D;
}

export function getTerrainHeight(x: number, z: number): number {
  // The terrain mesh is a PlaneGeometry rotated -π/2 around X, so
  // planeY maps to -worldZ. Negate z to sample noise at the same
  // coordinates the mesh used when generating vertex heights.
  const nz = -z;
  const dist = Math.sqrt(x * x + nz * nz);
  const valleyFactor = Math.min(1, dist / 60);

  let height = 0;
  height += noise2D(x * 0.02, nz * 0.02) * TERRAIN_HEIGHT;
  height += noise2D(x * 0.05, nz * 0.05) * 4;
  height += noise2D(x * 0.1, nz * 0.1) * 1.5;
  height += noise2D(x * 0.2, nz * 0.2) * 0.6;
  height += noise2D(x * 0.4, nz * 0.4) * 0.2;
  height *= valleyFactor;

  const centerPlateau = Math.max(0, 1 - dist / 15) * 3;
  height = Math.max(height, centerPlateau);

  return height;
}
