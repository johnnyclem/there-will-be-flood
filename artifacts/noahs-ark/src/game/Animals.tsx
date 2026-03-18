import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useGameStore,
  selectLocalPlayer,
  selectLocalArk,
  type AnimalState,
} from '../store/gameStore';
import { getTerrainHeight } from './Terrain';
import { Html, Line } from '@react-three/drei';

const FOLLOW_SPEED = 5.6; // 70% of walk speed (8)
const FOLLOW_RANGE_SQ = 25; // 5^2 — proximity to start following
const BOARD_RANGE_SQ = 64; // 8^2 — proximity to ark for boarding

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
        <mesh castShadow><sphereGeometry args={[d * 0.4, 8, 6]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
        <mesh castShadow position={[0, h * 0.2, d * 0.45]}><sphereGeometry args={[w * 0.32, 7, 5]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
        <mesh castShadow position={[0, h * 0.22, d * 0.4]}><sphereGeometry args={[w * 0.48, 6, 5]} /><meshStandardMaterial color="#A07830" roughness={0.9} /></mesh>
        <mesh castShadow position={[0, h * 0.08, d * 0.62]}><sphereGeometry args={[w * 0.14, 5, 4]} /><meshStandardMaterial color="#D4B87A" roughness={0.7} /></mesh>
        <mesh position={[-w * 0.12, h * 0.3, d * 0.6]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[w * 0.12, h * 0.3, d * 0.6]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh castShadow position={[0, h * 0.1, -d * 0.5]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.03, 0.02, d * 0.5, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <Legs color={color} size={size} legRadius={0.07} />
      </group>
    );
  }

  if (species === 'Elephant') {
    return (
      <group>
        <mesh castShadow><sphereGeometry args={[d * 0.42, 8, 7]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
        <mesh castShadow position={[0, h * 0.25, d * 0.42]}><sphereGeometry args={[w * 0.38, 7, 6]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <mesh castShadow position={[0, -h * 0.05, d * 0.65]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.1, 0.08, h * 0.6, 5]} /><meshStandardMaterial color="#7a7a7a" roughness={0.8} /></mesh>
        <mesh castShadow position={[-w * 0.45, h * 0.25, d * 0.3]} rotation={[0, 0.4, 0]}><sphereGeometry args={[w * 0.3, 5, 4]} /><meshStandardMaterial color="#777" roughness={0.85} side={THREE.DoubleSide} /></mesh>
        <mesh castShadow position={[w * 0.45, h * 0.25, d * 0.3]} rotation={[0, -0.4, 0]}><sphereGeometry args={[w * 0.3, 5, 4]} /><meshStandardMaterial color="#777" roughness={0.85} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-w * 0.18, h * 0.35, d * 0.58]}><sphereGeometry args={[0.05, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[w * 0.18, h * 0.35, d * 0.58]}><sphereGeometry args={[0.05, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <Legs color={color} size={size} legRadius={0.12} legColor="#7a7a7a" />
      </group>
    );
  }

  if (species === 'Dove') {
    return (
      <group>
        <mesh castShadow><sphereGeometry args={[d * 0.45, 7, 5]} /><meshStandardMaterial color={color} roughness={0.65} /></mesh>
        <mesh castShadow position={[0, h * 0.35, d * 0.3]}><sphereGeometry args={[w * 0.4, 6, 5]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
        <mesh castShadow position={[0, h * 0.2, d * 0.55]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.025, 0.08, 4]} /><meshStandardMaterial color="#E8A030" roughness={0.6} /></mesh>
        <mesh castShadow position={[-w * 0.45, h * 0.1, -d * 0.1]} rotation={[0, 0, -0.3]}><boxGeometry args={[w * 0.5, 0.02, d * 0.55]} /><meshStandardMaterial color="#CCCCCC" roughness={0.7} /></mesh>
        <mesh castShadow position={[w * 0.45, h * 0.1, -d * 0.1]} rotation={[0, 0, 0.3]}><boxGeometry args={[w * 0.5, 0.02, d * 0.55]} /><meshStandardMaterial color="#CCCCCC" roughness={0.7} /></mesh>
      </group>
    );
  }

  if (species === 'Horse') {
    return (
      <group>
        <mesh castShadow><boxGeometry args={[w * 0.85, h * 0.7, d]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
        <mesh castShadow position={[0, h * 0.4, d * 0.38]} rotation={[-0.5, 0, 0]}><cylinderGeometry args={[w * 0.18, w * 0.22, h * 0.6, 6]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
        <mesh castShadow position={[0, h * 0.55, d * 0.55]}><boxGeometry args={[w * 0.35, h * 0.3, d * 0.35]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
        <mesh position={[-w * 0.15, h * 0.6, d * 0.65]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[w * 0.15, h * 0.6, d * 0.65]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <Legs color={color} size={size} legRadius={0.06} />
      </group>
    );
  }

  if (species === 'Sheep') {
    return (
      <group>
        <mesh castShadow><sphereGeometry args={[d * 0.48, 7, 6]} /><meshStandardMaterial color="#F0ECD8" roughness={0.95} /></mesh>
        <mesh castShadow position={[0, h * 0.25, 0]}><sphereGeometry args={[d * 0.38, 5, 4]} /><meshStandardMaterial color="#E8E4D0" roughness={0.95} /></mesh>
        <mesh castShadow position={[0, h * 0.15, d * 0.42]}><sphereGeometry args={[w * 0.28, 6, 5]} /><meshStandardMaterial color="#3A3A3A" roughness={0.7} /></mesh>
        <mesh position={[-w * 0.1, h * 0.22, d * 0.55]}><sphereGeometry args={[0.03, 4, 4]} /><meshStandardMaterial color="#FFD700" /></mesh>
        <mesh position={[w * 0.1, h * 0.22, d * 0.55]}><sphereGeometry args={[0.03, 4, 4]} /><meshStandardMaterial color="#FFD700" /></mesh>
        <Legs color="#3A3A3A" size={size} legRadius={0.04} />
      </group>
    );
  }

  if (species === 'Wolf') {
    return (
      <group>
        <mesh castShadow><boxGeometry args={[w * 0.75, h * 0.65, d]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <mesh castShadow position={[0, h * 0.2, d * 0.45]}><boxGeometry args={[w * 0.5, h * 0.45, d * 0.35]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
        <mesh castShadow position={[0, h * 0.1, d * 0.65]}><boxGeometry args={[w * 0.25, h * 0.22, d * 0.25]} /><meshStandardMaterial color="#4A4A4A" roughness={0.75} /></mesh>
        <mesh position={[-w * 0.13, h * 0.28, d * 0.58]}><sphereGeometry args={[0.035, 4, 4]} /><meshStandardMaterial color="#D4A020" /></mesh>
        <mesh position={[w * 0.13, h * 0.28, d * 0.58]}><sphereGeometry args={[0.035, 4, 4]} /><meshStandardMaterial color="#D4A020" /></mesh>
        <mesh castShadow position={[-w * 0.15, h * 0.5, d * 0.4]}><coneGeometry args={[0.06, 0.18, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <mesh castShadow position={[w * 0.15, h * 0.5, d * 0.4]}><coneGeometry args={[0.06, 0.18, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <Legs color={color} size={size} legRadius={0.05} />
      </group>
    );
  }

  if (species === 'Bear') {
    return (
      <group>
        <mesh castShadow><sphereGeometry args={[d * 0.45, 8, 6]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
        <mesh castShadow position={[0, h * 0.2, d * 0.15]}><sphereGeometry args={[w * 0.42, 6, 5]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
        <mesh castShadow position={[0, h * 0.2, d * 0.42]}><sphereGeometry args={[w * 0.35, 7, 5]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        <mesh castShadow position={[0, h * 0.08, d * 0.6]}><sphereGeometry args={[w * 0.15, 5, 4]} /><meshStandardMaterial color="#6B5040" roughness={0.75} /></mesh>
        <mesh position={[-w * 0.13, h * 0.28, d * 0.55]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[w * 0.13, h * 0.28, d * 0.55]}><sphereGeometry args={[0.04, 4, 4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh castShadow position={[-w * 0.22, h * 0.42, d * 0.35]}><sphereGeometry args={[0.09, 5, 4]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
        <mesh castShadow position={[w * 0.22, h * 0.42, d * 0.35]}><sphereGeometry args={[0.09, 5, 4]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
        <Legs color={color} size={size} legRadius={0.1} legColor="#3D2A1A" />
      </group>
    );
  }

  // Fallback
  return (
    <group>
      <mesh castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      {h > 0.3 && <Legs color={color} size={size} />}
    </group>
  );
}

function TetherLine({ animalGroupRef, followingPlayerId, color, animalHeight }: {
  animalGroupRef: React.RefObject<THREE.Group | null>;
  followingPlayerId: string;
  color: string;
  animalHeight: number;
}) {
  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (!lineRef.current || !animalGroupRef.current) return;
    const state = useGameStore.getState();
    const follower = state.players[followingPlayerId];
    if (!follower) return;

    const animalPos = animalGroupRef.current.position;
    // Line points: from animal (local origin offset up) to player (world offset from animal)
    const points = [
      new THREE.Vector3(0, animalHeight * 0.3, 0),
      new THREE.Vector3(
        follower.position[0] - animalPos.x,
        follower.position[1] - animalPos.y + 0.5,
        follower.position[2] - animalPos.z,
      ),
    ];
    lineRef.current.geometry.setPositions(
      points.flatMap((p) => [p.x, p.y, p.z]),
    );
  });

  return (
    <Line
      ref={lineRef}
      points={[
        [0, animalHeight * 0.3, 0],
        [0, animalHeight * 0.3, 0],
      ]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
      dashed
      dashSize={0.3}
      gapSize={0.15}
    />
  );
}

function Animal({ data }: { data: AnimalState }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef(new THREE.Vector3(...data.startPosition));
  const timerRef = useRef(Math.random() * 5);
  const lastSyncedPos = useRef<[number, number, number]>([...data.startPosition]);
  const gameState = useGameStore((s) => s.gameState);
  const updateAnimalPosition = useGameStore((s) => s.updateAnimalPosition);
  const setAnimalFollowing = useGameStore((s) => s.setAnimalFollowing);
  const boardAnimal = useGameStore((s) => s.boardAnimal);
  const startTerrainY = getTerrainHeight(data.startPosition[0], data.startPosition[2]);

  const isBoarded = data.boardedByPlayerId !== null;
  const isFollowing = data.followingPlayerId !== null;

  const [isNearLocalPlayer, setIsNearLocalPlayer] = useState(false);
  const [isSubmerged, setIsSubmerged] = useState(false);
  const [canBoard, setCanBoard] = useState(false);

  useFrame((_, delta) => {
    if (!groupRef.current || gameState !== 'playing' || isBoarded) return;

    timerRef.current -= delta;
    const pos = groupRef.current.position;

    const state = useGameStore.getState();
    const { world, players, arks } = state;
    const waterLevel = world.waterLevel;
    const stormIntensity = world.stormIntensity;
    const localPlayer = players[state.localPlayerId];

    // --- Herding: check proximity to all players ---
    let closestPlayerId: string | null = null;
    let closestPlayerDist = FOLLOW_RANGE_SQ;

    for (const [pid, player] of Object.entries(players)) {
      const dx = player.position[0] - pos.x;
      const dz = player.position[2] - pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < closestPlayerDist) {
        closestPlayerDist = distSq;
        closestPlayerId = pid;
      }
    }

    // Update following state if a closer player is found
    if (closestPlayerId !== null && closestPlayerId !== data.followingPlayerId) {
      setAnimalFollowing(data.id, closestPlayerId);
    } else if (closestPlayerId === null && data.followingPlayerId !== null) {
      // No player close enough — stop following
      const follower = players[data.followingPlayerId];
      if (follower) {
        const dx = follower.position[0] - pos.x;
        const dz = follower.position[2] - pos.z;
        if (dx * dx + dz * dz > FOLLOW_RANGE_SQ * 4) {
          // Lost the player — stop following
          setAnimalFollowing(data.id, null);
        }
      }
    }

    // --- Movement ---
    if (data.followingPlayerId && players[data.followingPlayerId]) {
      // Following a player: move toward them
      const follower = players[data.followingPlayerId];
      _dir.set(
        follower.position[0] - pos.x,
        0,
        follower.position[2] - pos.z,
      );
      const dist = _dir.length();
      if (dist > 2) {
        _dir.normalize();
        pos.x += _dir.x * FOLLOW_SPEED * delta;
        pos.z += _dir.z * FOLLOW_SPEED * delta;
        groupRef.current.rotation.y = Math.atan2(_dir.x, _dir.z);
      }
    } else {
      // Wandering behavior
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

      _dir.set(targetRef.current.x - pos.x, 0, targetRef.current.z - pos.z);
      if (_dir.length() > 0.5) {
        _dir.normalize();
        const speed = stormIntensity > 0.5 ? data.speed * 2 : data.speed;
        pos.x += _dir.x * speed * delta;
        pos.z += _dir.z * speed * delta;
        groupRef.current.rotation.y = Math.atan2(_dir.x, _dir.z);
      }
    }

    // Y position: follow terrain/water
    const currentTerrainY = getTerrainHeight(pos.x, pos.z);
    const ty = Math.max(currentTerrainY, waterLevel) + data.size[1] / 2;
    pos.y += (ty - pos.y) * 0.1;

    // Update position in store only when moved > 0.5 units
    const lsp = lastSyncedPos.current;
    const sdx = pos.x - lsp[0];
    const sdy = pos.y - lsp[1];
    const sdz = pos.z - lsp[2];
    if (sdx * sdx + sdy * sdy + sdz * sdz > 0.25) {
      lastSyncedPos.current = [pos.x, pos.y, pos.z];
      updateAnimalPosition(data.id, [pos.x, pos.y, pos.z]);
    }

    // Submersion check
    const submerged = currentTerrainY < waterLevel - 0.5;
    setIsSubmerged((prev) => (prev !== submerged ? submerged : prev));

    // Local player proximity check
    if (localPlayer) {
      const dx = localPlayer.position[0] - pos.x;
      const dz = localPlayer.position[2] - pos.z;
      const nearby = dx * dx + dz * dz < FOLLOW_RANGE_SQ;
      setIsNearLocalPlayer((prev) => (prev !== nearby ? nearby : prev));

      // Can board check: animal is following local player AND near local player's ark
      const localArk = arks[state.localPlayerId];
      if (data.followingPlayerId === state.localPlayerId && localArk?.position) {
        const adx = pos.x - localArk.position[0];
        const adz = pos.z - localArk.position[2];
        const nearArk = adx * adx + adz * adz < BOARD_RANGE_SQ;
        setCanBoard((prev) => (prev !== nearArk ? nearArk : prev));
      } else {
        setCanBoard((prev) => (prev !== false ? false : prev));
      }
    }
  });

  if (isSubmerged || isBoarded) return null;

  // Get follower color for tether line
  const followerColor = useGameStore((s) => {
    if (!data.followingPlayerId) return null;
    return s.players[data.followingPlayerId]?.color ?? null;
  });

  return (
    <group ref={groupRef} position={[data.startPosition[0], startTerrainY + data.size[1] / 2, data.startPosition[2]]}>
      <AnimalModel species={data.species} color={data.color} size={data.size} />

      {/* Tether line when following a player */}
      {isFollowing && followerColor && data.followingPlayerId && (
        <TetherLine
          animalGroupRef={groupRef}
          followingPlayerId={data.followingPlayerId}
          color={followerColor}
          animalHeight={data.size[1]}
        />
      )}

      {isNearLocalPlayer && (
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
            {data.species}
            {isFollowing && data.followingPlayerId === useGameStore.getState().localPlayerId && (
              <span style={{ color: '#2ecc71' }}> (Following you)</span>
            )}
            {isFollowing && data.followingPlayerId !== useGameStore.getState().localPlayerId && (
              <span style={{ color: '#e74c3c' }}> (Following rival)</span>
            )}
            {canBoard && (
              <>
                <br />
                <span style={{ color: '#ffdd00' }}>[F] Board onto Ark</span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Animals() {
  const animalStates = useGameStore((s) => s.animalStates);
  const boardAnimal = useGameStore((s) => s.boardAnimal);

  // F key handler: board the animal if it's following us and near our ark
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      const state = useGameStore.getState();
      if (state.gameState !== 'playing') return;

      const localId = state.localPlayerId;
      const localPlayer = state.players[localId];
      const localArk = state.arks[localId];
      if (!localPlayer || !localArk?.position) return;

      // Find the nearest animal that's following us and near our ark
      let nearestId = -1;
      let nearestDist = Infinity;

      for (const animal of state.animalStates) {
        if (animal.boardedByPlayerId !== null) continue;
        if (animal.followingPlayerId !== localId) continue;

        // Check animal is near our ark
        const adx = animal.position[0] - localArk.position[0];
        const adz = animal.position[2] - localArk.position[2];
        if (adx * adx + adz * adz > BOARD_RANGE_SQ) continue;

        // Check distance from player
        const dx = localPlayer.position[0] - animal.position[0];
        const dz = localPlayer.position[2] - animal.position[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearestId = animal.id;
        }
      }

      if (nearestId >= 0) {
        state.boardAnimal(nearestId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardAnimal]);

  return (
    <group>
      {animalStates.map((animal) => (
        <Animal key={animal.id} data={animal} />
      ))}
    </group>
  );
}
