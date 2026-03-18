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

const BOARD_RANGE_SQ = 25; // 5^2 — must be near ark too
const ARK_RANGE_SQ = 225; // 15^2

// Reusable Vector3 to avoid GC pressure
const _dir = new THREE.Vector3();

// Per-species leg helper
function Legs({ color, size, legRadius = 0.07, legColor }: {
  color: string; size: [number, number, number]; legRadius?: number; legColor?: string;
}) {
  const c = legColor || color;
  const h = size[1] * 0.5;
  return (
    <>
      <mesh castShadow position={[-size[0] * 0.28, -size[1] * 0.35, size[2] * 0.25]}>
        <cylinderGeometry args={[legRadius, legRadius * 1.1, h, 5]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[size[0] * 0.28, -size[1] * 0.35, size[2] * 0.25]}>
        <cylinderGeometry args={[legRadius, legRadius * 1.1, h, 5]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-size[0] * 0.28, -size[1] * 0.35, -size[2] * 0.25]}>
        <cylinderGeometry args={[legRadius, legRadius * 1.1, h, 5]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[size[0] * 0.28, -size[1] * 0.35, -size[2] * 0.25]}>
        <cylinderGeometry args={[legRadius, legRadius * 1.1, h, 5]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>
    </>
  );
}

function AnimalModel({ species, color, size }: { species: string; color: string; size: [number, number, number] }) {
  const [w, h, d] = size;

  if (species === 'Lion') {
    return (
      <group>
        {/* Rounded body */}
        <mesh castShadow>
          <sphereGeometry args={[d * 0.4, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, h * 0.2, d * 0.45]}>
          <sphereGeometry args={[w * 0.32, 7, 5]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Mane — bushy ring around head */}
        <mesh castShadow position={[0, h * 0.22, d * 0.4]}>
          <sphereGeometry args={[w * 0.48, 6, 5]} />
          <meshStandardMaterial color="#A07830" roughness={0.9} />
        </mesh>
        {/* Snout */}
        <mesh castShadow position={[0, h * 0.08, d * 0.62]}>
          <sphereGeometry args={[w * 0.14, 5, 4]} />
          <meshStandardMaterial color="#D4B87A" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.12, h * 0.3, d * 0.6]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[w * 0.12, h * 0.3, d * 0.6]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Ears */}
        <mesh castShadow position={[-w * 0.2, h * 0.45, d * 0.38]}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial color="#A07830" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[w * 0.2, h * 0.45, d * 0.38]}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial color="#A07830" roughness={0.8} />
        </mesh>
        {/* Tail */}
        <mesh castShadow position={[0, h * 0.1, -d * 0.5]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, d * 0.5, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Tail tuft */}
        <mesh castShadow position={[0, h * 0.3, -d * 0.7]}>
          <sphereGeometry args={[0.07, 4, 4]} />
          <meshStandardMaterial color="#A07830" roughness={0.9} />
        </mesh>
        <Legs color={color} size={size} legRadius={0.07} />
      </group>
    );
  }

  if (species === 'Elephant') {
    return (
      <group>
        {/* Big round body */}
        <mesh castShadow>
          <sphereGeometry args={[d * 0.42, 8, 7]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, h * 0.25, d * 0.42]}>
          <sphereGeometry args={[w * 0.38, 7, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Trunk — segmented cylinders curving down */}
        <mesh castShadow position={[0, -h * 0.05, d * 0.65]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.08, h * 0.6, 5]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -h * 0.35, d * 0.72]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.05, h * 0.35, 5]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
        </mesh>
        {/* Big ears */}
        <mesh castShadow position={[-w * 0.45, h * 0.25, d * 0.3]} rotation={[0, 0.4, 0]}>
          <sphereGeometry args={[w * 0.3, 5, 4]} />
          <meshStandardMaterial color="#777" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh castShadow position={[w * 0.45, h * 0.25, d * 0.3]} rotation={[0, -0.4, 0]}>
          <sphereGeometry args={[w * 0.3, 5, 4]} />
          <meshStandardMaterial color="#777" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Tusks */}
        <mesh castShadow position={[-0.12, -h * 0.05, d * 0.6]} rotation={[0.4, 0, 0.15]}>
          <coneGeometry args={[0.04, 0.3, 4]} />
          <meshStandardMaterial color="#F5F0E0" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.12, -h * 0.05, d * 0.6]} rotation={[0.4, 0, -0.15]}>
          <coneGeometry args={[0.04, 0.3, 4]} />
          <meshStandardMaterial color="#F5F0E0" roughness={0.5} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.18, h * 0.35, d * 0.58]}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[w * 0.18, h * 0.35, d * 0.58]}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Tail */}
        <mesh castShadow position={[0, h * 0.05, -d * 0.45]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.015, d * 0.3, 4]} />
          <meshStandardMaterial color="#777" roughness={0.8} />
        </mesh>
        <Legs color={color} size={size} legRadius={0.12} legColor="#7a7a7a" />
      </group>
    );
  }

  if (species === 'Dove') {
    return (
      <group>
        {/* Round body */}
        <mesh castShadow>
          <sphereGeometry args={[d * 0.45, 7, 5]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, h * 0.35, d * 0.3]}>
          <sphereGeometry args={[w * 0.4, 6, 5]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* Beak */}
        <mesh castShadow position={[0, h * 0.2, d * 0.55]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.025, 0.08, 4]} />
          <meshStandardMaterial color="#E8A030" roughness={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.15, h * 0.42, d * 0.42]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[w * 0.15, h * 0.42, d * 0.42]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Left wing */}
        <mesh castShadow position={[-w * 0.45, h * 0.1, -d * 0.1]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[w * 0.5, 0.02, d * 0.55]} />
          <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
        </mesh>
        {/* Right wing */}
        <mesh castShadow position={[w * 0.45, h * 0.1, -d * 0.1]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[w * 0.5, 0.02, d * 0.55]} />
          <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
        </mesh>
        {/* Tail feathers */}
        <mesh castShadow position={[0, h * 0.1, -d * 0.45]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[w * 0.35, 0.02, d * 0.35]} />
          <meshStandardMaterial color="#BBBBBB" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (species === 'Horse') {
    return (
      <group>
        {/* Elongated body */}
        <mesh castShadow>
          <boxGeometry args={[w * 0.85, h * 0.7, d]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* Neck — angled up */}
        <mesh castShadow position={[0, h * 0.4, d * 0.38]} rotation={[-0.5, 0, 0]}>
          <cylinderGeometry args={[w * 0.18, w * 0.22, h * 0.6, 6]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* Head — elongated box */}
        <mesh castShadow position={[0, h * 0.55, d * 0.55]}>
          <boxGeometry args={[w * 0.35, h * 0.3, d * 0.35]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Snout */}
        <mesh castShadow position={[0, h * 0.42, d * 0.7]}>
          <boxGeometry args={[w * 0.25, h * 0.2, d * 0.2]} />
          <meshStandardMaterial color="#7A3E10" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.15, h * 0.6, d * 0.65]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[w * 0.15, h * 0.6, d * 0.65]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Ears */}
        <mesh castShadow position={[-w * 0.1, h * 0.75, d * 0.5]} rotation={[0.2, 0, -0.2]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[w * 0.1, h * 0.75, d * 0.5]} rotation={[0.2, 0, 0.2]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Mane — ridge along neck */}
        <mesh castShadow position={[0, h * 0.55, d * 0.3]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.04, h * 0.25, d * 0.35]} />
          <meshStandardMaterial color="#2A1508" roughness={0.9} />
        </mesh>
        {/* Tail */}
        <mesh castShadow position={[0, h * 0.05, -d * 0.55]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.01, d * 0.5, 4]} />
          <meshStandardMaterial color="#2A1508" roughness={0.9} />
        </mesh>
        <Legs color={color} size={size} legRadius={0.06} />
      </group>
    );
  }

  if (species === 'Sheep') {
    return (
      <group>
        {/* Puffy woolly body — big sphere */}
        <mesh castShadow>
          <sphereGeometry args={[d * 0.48, 7, 6]} />
          <meshStandardMaterial color="#F0ECD8" roughness={0.95} />
        </mesh>
        {/* Extra wool bumps */}
        <mesh castShadow position={[0, h * 0.25, 0]}>
          <sphereGeometry args={[d * 0.38, 5, 4]} />
          <meshStandardMaterial color="#E8E4D0" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[w * 0.15, h * 0.05, d * 0.15]}>
          <sphereGeometry args={[d * 0.25, 5, 4]} />
          <meshStandardMaterial color="#F5F0E0" roughness={0.95} />
        </mesh>
        {/* Small dark head */}
        <mesh castShadow position={[0, h * 0.15, d * 0.42]}>
          <sphereGeometry args={[w * 0.28, 6, 5]} />
          <meshStandardMaterial color="#3A3A3A" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.1, h * 0.22, d * 0.55]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        <mesh position={[w * 0.1, h * 0.22, d * 0.55]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        {/* Ears — floppy */}
        <mesh castShadow position={[-w * 0.22, h * 0.15, d * 0.38]} rotation={[0, 0, -0.5]}>
          <sphereGeometry args={[0.06, 4, 3]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[w * 0.22, h * 0.15, d * 0.38]} rotation={[0, 0, 0.5]}>
          <sphereGeometry args={[0.06, 4, 3]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Short tail puff */}
        <mesh castShadow position={[0, h * 0.1, -d * 0.4]}>
          <sphereGeometry args={[0.1, 4, 4]} />
          <meshStandardMaterial color="#F0ECD8" roughness={0.95} />
        </mesh>
        <Legs color="#3A3A3A" size={size} legRadius={0.04} />
      </group>
    );
  }

  if (species === 'Wolf') {
    return (
      <group>
        {/* Lean body */}
        <mesh castShadow>
          <boxGeometry args={[w * 0.75, h * 0.65, d]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, h * 0.2, d * 0.45]}>
          <boxGeometry args={[w * 0.5, h * 0.45, d * 0.35]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
        {/* Narrow snout */}
        <mesh castShadow position={[0, h * 0.1, d * 0.65]}>
          <boxGeometry args={[w * 0.25, h * 0.22, d * 0.25]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.75} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, h * 0.12, d * 0.78]}>
          <sphereGeometry args={[0.035, 4, 4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Eyes — amber */}
        <mesh position={[-w * 0.13, h * 0.28, d * 0.58]}>
          <sphereGeometry args={[0.035, 4, 4]} />
          <meshStandardMaterial color="#D4A020" />
        </mesh>
        <mesh position={[w * 0.13, h * 0.28, d * 0.58]}>
          <sphereGeometry args={[0.035, 4, 4]} />
          <meshStandardMaterial color="#D4A020" />
        </mesh>
        {/* Pointed ears */}
        <mesh castShadow position={[-w * 0.15, h * 0.5, d * 0.4]}>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[w * 0.15, h * 0.5, d * 0.4]}>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Bushy tail — curving up */}
        <mesh castShadow position={[0, h * 0.15, -d * 0.5]} rotation={[0.9, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.03, d * 0.45, 5]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, h * 0.38, -d * 0.62]}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial color="#666" roughness={0.9} />
        </mesh>
        {/* Belly lighter patch */}
        <mesh castShadow position={[0, -h * 0.15, 0]}>
          <boxGeometry args={[w * 0.5, h * 0.2, d * 0.6]} />
          <meshStandardMaterial color="#7A7A7A" roughness={0.8} />
        </mesh>
        <Legs color={color} size={size} legRadius={0.05} />
      </group>
    );
  }

  if (species === 'Bear') {
    return (
      <group>
        {/* Bulky round body */}
        <mesh castShadow>
          <sphereGeometry args={[d * 0.45, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Hump/shoulders */}
        <mesh castShadow position={[0, h * 0.2, d * 0.15]}>
          <sphereGeometry args={[w * 0.42, 6, 5]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, h * 0.2, d * 0.42]}>
          <sphereGeometry args={[w * 0.35, 7, 5]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Snout — lighter */}
        <mesh castShadow position={[0, h * 0.08, d * 0.6]}>
          <sphereGeometry args={[w * 0.15, 5, 4]} />
          <meshStandardMaterial color="#6B5040" roughness={0.75} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, h * 0.12, d * 0.68]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-w * 0.13, h * 0.28, d * 0.55]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[w * 0.13, h * 0.28, d * 0.55]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Small round ears */}
        <mesh castShadow position={[-w * 0.22, h * 0.42, d * 0.35]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[w * 0.22, h * 0.42, d * 0.35]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Inner ears */}
        <mesh position={[-w * 0.22, h * 0.42, d * 0.38]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color="#5A4535" />
        </mesh>
        <mesh position={[w * 0.22, h * 0.42, d * 0.38]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color="#5A4535" />
        </mesh>
        <Legs color={color} size={size} legRadius={0.1} legColor="#3D2A1A" />
      </group>
    );
  }

  // Fallback generic shape
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, h * 0.3, d * 0.45]}>
        <boxGeometry args={[w * 0.6, h * 0.6, d * 0.3]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {h > 0.3 && <Legs color={color} size={size} />}
    </group>
  );
}

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
      <AnimalModel species={data.species} color={data.color} size={data.size} />

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
      if (!ark.position) return; // ark not placed yet

      // Check player is near the ark
      const adx = player.position[0] - ark.position[0];
      const adz = player.position[2] - ark.position[2];
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
