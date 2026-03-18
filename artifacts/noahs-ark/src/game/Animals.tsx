import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';
import { Html } from '@react-three/drei';

interface AnimalData {
  id: number;
  species: string;
  color: string;
  size: [number, number, number];
  startPosition: [number, number, number];
  wanderRadius: number;
  speed: number;
  paired: boolean;
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

const SPECIES = [
  { name: 'Lion', color: '#C4A35A', size: [0.8, 0.5, 1.2] as [number, number, number] },
  { name: 'Elephant', color: '#888888', size: [1.4, 1.0, 1.8] as [number, number, number] },
  { name: 'Dove', color: '#DDDDDD', size: [0.25, 0.2, 0.3] as [number, number, number] },
  { name: 'Horse', color: '#8B4513', size: [0.7, 0.6, 1.2] as [number, number, number] },
  { name: 'Sheep', color: '#F5F5DC', size: [0.5, 0.4, 0.7] as [number, number, number] },
  { name: 'Wolf', color: '#5C5C5C', size: [0.6, 0.4, 0.9] as [number, number, number] },
  { name: 'Bear', color: '#4A3728', size: [0.9, 0.7, 1.1] as [number, number, number] },
];

const ARK_POSITION = [15, 0, -10];
const BOARD_RANGE_SQ = 25; // 5^2 — must be near ark too
const ARK_RANGE_SQ = 225; // 15^2

// Reusable Vector3 to avoid GC pressure
const _dir = new THREE.Vector3();

function Animal({ data }: { data: AnimalData }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef(new THREE.Vector3(...data.startPosition));
  const timerRef = useRef(Math.random() * 5);
  const gameState = useGameStore((s) => s.gameState);
  const boardAnimal = useGameStore((s) => s.boardAnimal);
  const isBoarded = useGameStore((s) => s.ark.boardedAnimalIds.includes(data.id));
  const [isSubmerged, setIsSubmerged] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const startTerrainY = getTerrainHeight(data.startPosition[0], data.startPosition[2]);

  useFrame((_, delta) => {
    if (!groupRef.current || gameState !== 'playing' || isBoarded) return;

    timerRef.current -= delta;
    const pos = groupRef.current.position;

    const { player, world } = useGameStore.getState();
    const waterLevel = world.waterLevel;
    const stormIntensity = world.stormIntensity;

    if (timerRef.current <= 0) {
      timerRef.current = 3 + Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * data.wanderRadius;

      let tx = data.startPosition[0] + Math.cos(angle) * dist;
      let tz = data.startPosition[2] + Math.sin(angle) * dist;

      if (stormIntensity > 0.5) {
        const fleeAngle = Math.atan2(pos.z, pos.x);
        tx = pos.x + Math.cos(fleeAngle) * 5;
        tz = pos.z + Math.sin(fleeAngle) * 5;
      }

      targetRef.current.set(tx, 0, tz);
    }

    const currentTerrainY = getTerrainHeight(pos.x, pos.z);
    const ty = Math.max(currentTerrainY, waterLevel) + data.size[1] / 2;

    _dir.set(targetRef.current.x - pos.x, 0, targetRef.current.z - pos.z);

    if (_dir.length() > 0.5) {
      _dir.normalize();
      const speed = stormIntensity > 0.5 ? data.speed * 2 : data.speed;
      pos.x += _dir.x * speed * delta;
      pos.z += _dir.z * speed * delta;
      groupRef.current.rotation.y = Math.atan2(_dir.x, _dir.z);
    }

    pos.y += (ty - pos.y) * 0.1;

    const submerged = currentTerrainY < waterLevel - 0.5;
    setIsSubmerged((prev) => (prev !== submerged ? submerged : prev));

    const dx = player.position[0] - pos.x;
    const dz = player.position[2] - pos.z;
    const nearby = dx * dx + dz * dz < 25;
    setIsNearby((prev) => (prev !== nearby ? nearby : prev));
  });

  if (isSubmerged || isBoarded) return null;

  return (
    <group ref={groupRef} position={[data.startPosition[0], startTerrainY + data.size[1] / 2, data.startPosition[2]]}>
      <mesh castShadow>
        <boxGeometry args={data.size} />
        <meshStandardMaterial color={data.color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, data.size[1] * 0.3, data.size[2] * 0.45]}>
        <boxGeometry args={[data.size[0] * 0.6, data.size[1] * 0.6, data.size[2] * 0.3]} />
        <meshStandardMaterial color={data.color} roughness={0.7} />
      </mesh>

      {data.size[1] > 0.3 && (
        <>
          <mesh castShadow position={[-data.size[0] * 0.3, -data.size[1] * 0.3, data.size[2] * 0.25]}>
            <cylinderGeometry args={[0.06, 0.06, data.size[1] * 0.6, 4]} />
            <meshStandardMaterial color={data.color} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[data.size[0] * 0.3, -data.size[1] * 0.3, data.size[2] * 0.25]}>
            <cylinderGeometry args={[0.06, 0.06, data.size[1] * 0.6, 4]} />
            <meshStandardMaterial color={data.color} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[-data.size[0] * 0.3, -data.size[1] * 0.3, -data.size[2] * 0.25]}>
            <cylinderGeometry args={[0.06, 0.06, data.size[1] * 0.6, 4]} />
            <meshStandardMaterial color={data.color} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[data.size[0] * 0.3, -data.size[1] * 0.3, -data.size[2] * 0.25]}>
            <cylinderGeometry args={[0.06, 0.06, data.size[1] * 0.6, 4]} />
            <meshStandardMaterial color={data.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {isNearby && (
        <Html center position={[0, data.size[1] + 0.5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}>
            {data.species} {data.paired ? '(Pair)' : ''}
            <br />
            <span
              style={{ color: '#ffdd00', cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => boardAnimal(data.id)}
            >
              [F] Board onto Ark
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

export function Animals() {
  const animals = useMemo(() => {
    const result: AnimalData[] = [];
    const rng = mulberry32(99999);
    let id = 0;

    for (const species of SPECIES) {
      for (let pair = 0; pair < 2; pair++) {
        const angle = rng() * Math.PI * 2;
        const dist = 20 + rng() * 50;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        result.push({
          id: id++,
          species: species.name,
          color: species.color,
          size: species.size,
          startPosition: [x, 0, z],
          wanderRadius: 8 + rng() * 12,
          speed: 1 + rng() * 2,
          paired: pair === 1,
        });
      }
    }

    return result;
  }, []);

  // F key handler: board the nearest animal within range (must also be near ark)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      const { gameState, player, ark } = useGameStore.getState();
      if (gameState !== 'playing') return;

      // Check player is near the ark
      const adx = player.position[0] - ARK_POSITION[0];
      const adz = player.position[2] - ARK_POSITION[2];
      if (adx * adx + adz * adz > ARK_RANGE_SQ) return;

      // Find nearest non-boarded animal within range
      // We need to read animal positions from the DOM/refs, but since animals
      // track their own positions, we check playerPos vs animal startPositions
      // as a reasonable approximation (animals wander near their start)
      let nearestId = -1;
      let nearestDist = BOARD_RANGE_SQ;

      for (const animal of animals) {
        if (ark.boardedAnimalIds.includes(animal.id)) continue;
        const dx = player.position[0] - animal.startPosition[0];
        const dz = player.position[2] - animal.startPosition[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearestId = animal.id;
        }
      }

      if (nearestId >= 0) {
        useGameStore.getState().boardAnimal(nearestId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animals]);

  return (
    <group>
      {animals.map((animal) => (
        <Animal key={animal.id} data={animal} />
      ))}
    </group>
  );
}
