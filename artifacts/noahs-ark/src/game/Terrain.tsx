import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 128;
const TERRAIN_HEIGHT = 15;

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    const noise2D = createNoise2D(() => 0.42);
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
      height *= valleyFactor;

      const centerPlateau = Math.max(0, 1 - dist / 15) * 3;
      height = Math.max(height, centerPlateau);

      positions.setZ(i, height);

      const normalizedHeight = (height + 2) / (TERRAIN_HEIGHT + 2);
      if (normalizedHeight < 0.1) {
        colors[i * 3] = 0.6;
        colors[i * 3 + 1] = 0.55;
        colors[i * 3 + 2] = 0.4;
      } else if (normalizedHeight < 0.4) {
        colors[i * 3] = 0.3;
        colors[i * 3 + 1] = 0.5 + normalizedHeight * 0.3;
        colors[i * 3 + 2] = 0.2;
      } else if (normalizedHeight < 0.7) {
        colors[i * 3] = 0.35;
        colors[i * 3 + 1] = 0.45;
        colors[i * 3 + 2] = 0.25;
      } else {
        colors[i * 3] = 0.5 + normalizedHeight * 0.3;
        colors[i * 3 + 1] = 0.45 + normalizedHeight * 0.2;
        colors[i * 3 + 2] = 0.35;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} />
    </mesh>
  );
}

export function getTerrainHeight(x: number, z: number): number {
  const noise2D = createNoise2D(() => 0.42);
  const dist = Math.sqrt(x * x + z * z);
  const valleyFactor = Math.min(1, dist / 60);

  let height = 0;
  height += noise2D(x * 0.02, z * 0.02) * TERRAIN_HEIGHT;
  height += noise2D(x * 0.05, z * 0.05) * 4;
  height += noise2D(x * 0.1, z * 0.1) * 1.5;
  height *= valleyFactor;

  const centerPlateau = Math.max(0, 1 - dist / 15) * 3;
  height = Math.max(height, centerPlateau);

  return height;
}
