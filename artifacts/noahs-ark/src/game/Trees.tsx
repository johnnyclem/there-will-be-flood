import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

interface TreeData {
  position: [number, number, number];
  scale: number;
  trunkHeight: number;
  canopySize: number;
  type: 'pine' | 'oak' | 'bush';
}

interface RockData {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: number;
}

function Tree({ position, scale, trunkHeight, canopySize, type }: TreeData) {
  if (type === 'bush') {
    return (
      <group position={position}>
        <mesh castShadow position={[0, canopySize * 0.4, 0]}>
          <sphereGeometry args={[canopySize * 0.6, 6, 6]} />
          <meshStandardMaterial color="#2d5a1e" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (type === 'pine') {
    return (
      <group position={position} scale={scale}>
        <mesh castShadow position={[0, trunkHeight / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.15, trunkHeight, 6]} />
          <meshStandardMaterial color="#5C4033" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, trunkHeight * 0.6, 0]}>
          <coneGeometry args={[canopySize, canopySize * 2, 6]} />
          <meshStandardMaterial color="#1a4a1a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, trunkHeight * 0.9, 0]}>
          <coneGeometry args={[canopySize * 0.7, canopySize * 1.5, 6]} />
          <meshStandardMaterial color="#22552a" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.2, trunkHeight, 6]} />
        <meshStandardMaterial color="#6B4226" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, trunkHeight, 0]}>
        <sphereGeometry args={[canopySize, 6, 6]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale, rotation }: RockData) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={[0, rotation, 0]} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#777777" roughness={0.95} />
    </mesh>
  );
}

export function Trees() {
  const trees = useMemo<TreeData[]>(() => {
    const result: TreeData[] = [];
    const rng = mulberry32(12345);

    for (let i = 0; i < 200; i++) {
      const x = (rng() - 0.5) * 160;
      const z = (rng() - 0.5) * 160;
      const dist = Math.sqrt(x * x + z * z);

      if (dist < 12) continue;

      const y = getTerrainHeight(x, z);
      if (y < -1) continue;

      const types: Array<'pine' | 'oak' | 'bush'> = ['pine', 'oak', 'bush'];
      const type = types[Math.floor(rng() * 3)];

      result.push({
        position: [x, y, z],
        scale: 0.8 + rng() * 0.6,
        trunkHeight: 1.5 + rng() * 2,
        canopySize: 0.8 + rng() * 1.2,
        type,
      });
    }
    return result;
  }, []);

  const rocks = useMemo<RockData[]>(() => {
    const result: RockData[] = [];
    const rng = mulberry32(67890);

    for (let i = 0; i < 80; i++) {
      const x = (rng() - 0.5) * 160;
      const z = (rng() - 0.5) * 160;
      const y = getTerrainHeight(x, z);

      if (y < -1) continue;

      result.push({
        position: [x, y, z],
        scale: [0.3 + rng() * 0.8, 0.3 + rng() * 0.6, 0.3 + rng() * 0.8],
        rotation: rng() * Math.PI * 2,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((tree, i) => (
        <Tree key={`tree-${i}`} {...tree} />
      ))}
      {rocks.map((rock, i) => (
        <Rock key={`rock-${i}`} {...rock} />
      ))}
    </group>
  );
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
