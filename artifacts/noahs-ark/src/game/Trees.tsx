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
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#807870" roughness={0.95} />
      </mesh>
      {/* Moss patch on top */}
      <mesh position={[0, 0.6, 0.2]}>
        <sphereGeometry args={[0.45, 4, 3]} />
        <meshStandardMaterial color="#3a5a28" roughness={0.95} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

interface GrassTuftData {
  position: [number, number, number];
  scale: number;
  rotation: number;
  hasFlower: boolean;
  flowerColor: string;
}

function GrassTuft({ position, scale, rotation, hasFlower, flowerColor }: GrassTuftData) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Grass blades — 3 crossed planes */}
      <mesh position={[0, 0.15, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.04, 0.35, 0.01]} />
        <meshStandardMaterial color="#3a6a20" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, 0.12, 0.02]} rotation={[-0.15, 0.8, 0.1]}>
        <boxGeometry args={[0.035, 0.3, 0.01]} />
        <meshStandardMaterial color="#2d5a18" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.04, 0.13, -0.02]} rotation={[0.12, -0.6, -0.08]}>
        <boxGeometry args={[0.035, 0.28, 0.01]} />
        <meshStandardMaterial color="#448a2a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {hasFlower && (
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color={flowerColor} roughness={0.7} />
        </mesh>
      )}
    </group>
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

  const grassTufts = useMemo<GrassTuftData[]>(() => {
    const result: GrassTuftData[] = [];
    const rng = mulberry32(54321);
    const flowerColors = ['#E85588', '#FFDD44', '#CC77FF', '#FF8844', '#FFFFFF'];

    for (let i = 0; i < 400; i++) {
      const x = (rng() - 0.5) * 150;
      const z = (rng() - 0.5) * 150;
      const y = getTerrainHeight(x, z);

      if (y < -0.5 || y > 10) continue;
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 8) continue;

      const hasFlower = rng() < 0.2;
      result.push({
        position: [x, y, z],
        scale: 0.6 + rng() * 0.8,
        rotation: rng() * Math.PI * 2,
        hasFlower,
        flowerColor: flowerColors[Math.floor(rng() * flowerColors.length)],
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
      {grassTufts.map((tuft, i) => (
        <GrassTuft key={`grass-${i}`} {...tuft} />
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
