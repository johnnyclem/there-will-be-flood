import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';
import { moveToward } from './ai/AINavigation';
import { AIBrain } from './ai/AIBrain';

/** Fog-of-war radius: rival is only rendered within this distance of local player. */
const FOG_OF_WAR_RADIUS = 30;
const FOG_OF_WAR_RADIUS_SQ = FOG_OF_WAR_RADIUS * FOG_OF_WAR_RADIUS;

/** Distance from target at which we consider the AI "arrived". */
const ARRIVAL_THRESHOLD = 1.2;
const ARRIVAL_THRESHOLD_SQ = ARRIVAL_THRESHOLD * ARRIVAL_THRESHOLD;

/** Distance within which we try to herd an animal (walk close enough to trigger follow). */
const HERD_RANGE = 5;
const HERD_RANGE_SQ = HERD_RANGE * HERD_RANGE;

/** Distance within which a following animal is considered "at ark" and can board. */
const BOARD_RANGE = 4;
const BOARD_RANGE_SQ = BOARD_RANGE * BOARD_RANGE;

interface RivalPlayerProps {
  playerId: string;
}

export function RivalPlayer({ playerId }: RivalPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const renderPosRef = useRef(new THREE.Vector3());
  const isVisibleRef = useRef(false);

  // Read minimal player state for rendering
  const playerColor = useGameStore((s) => s.players[playerId]?.color ?? '#C0392B');
  const playerName = useGameStore((s) => s.players[playerId]?.name ?? 'Rival');
  const difficulty = useGameStore((s) => s.matchConfig.aiDifficulty);
  const gameState = useGameStore((s) => s.gameState);

  // Create the AIBrain instance once (stable ref)
  const brain = useMemo(
    () => new AIBrain(playerId, difficulty),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerId, difficulty],
  );

  // --- useFrame: AI logic + rendering ---
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    const store = useGameStore.getState();
    const player = store.players[playerId];
    if (!player) return;

    // Tick the brain (decrements timers, re-evaluates goal if needed)
    brain.tick(delta);

    const decision = brain.getDecision();
    const pos = player.position;

    // ----- Movement -----
    if (decision.targetPosition && decision.action !== 'IDLE') {
      const target = decision.targetPosition;
      const baseSpeed = 8 * brain.config.speedMultiplier;

      // Check speed_blessing active effect
      const hasSpeedBlessing = player.activeEffects.some(
        (e) => e.type === 'speed_blessing' && (e.expiresAt === 0 || e.expiresAt > Date.now()),
      );
      const speed = hasSpeedBlessing ? baseSpeed * 1.5 : baseSpeed;

      const newPos = moveToward(pos, target, speed, delta);
      store.setPlayerPosition(newPos, playerId);

      const dx = target[0] - newPos[0];
      const dz = target[2] - newPos[2];
      const d2 = dx * dx + dz * dz;

      // ---- Arrived at target ----
      if (d2 < ARRIVAL_THRESHOLD_SQ) {
        if (decision.action === 'MOVE' && decision.goal === 'HERDING') {
          // Herding: get close to animal to make it follow
          if (decision.targetAnimalId !== null) {
            const animal = store.animalStates.find((a) => a.id === decision.targetAnimalId);
            if (animal) {
              const adx = animal.position[0] - newPos[0];
              const adz = animal.position[2] - newPos[2];
              if (adx * adx + adz * adz < HERD_RANGE_SQ) {
                brain.tryHerd(animal.id);
              }
            }
          }
        } else {
          brain.executeArrivalAction();
        }
      }

      // ---- Herding: once animal follows, walk it toward ark ----
      const ark = store.arks[playerId];
      if (decision.goal === 'HERDING' && decision.targetAnimalId !== null && ark?.position) {
        const animal = store.animalStates.find((a) => a.id === decision.targetAnimalId);
        if (animal && animal.followingPlayerId === playerId) {
          // Animal is following us — check if we + animal are both near ark
          const arkPos = ark.position;
          const myDistToArkSq =
            (newPos[0] - arkPos[0]) ** 2 + (newPos[2] - arkPos[2]) ** 2;
          const animalDistToArkSq =
            (animal.position[0] - arkPos[0]) ** 2 +
            (animal.position[2] - arkPos[2]) ** 2;

          if (myDistToArkSq < BOARD_RANGE_SQ && animalDistToArkSq < BOARD_RANGE_SQ * 4) {
            // Both near ark — board the animal
            store.boardAnimal(decision.targetAnimalId, playerId);
          }
        }
      }
    }

    // ----- Smooth rendering interpolation -----
    if (groupRef.current) {
      const rp = renderPosRef.current;
      const currentPos = store.players[playerId]?.position ?? player.position;

      rp.x += (currentPos[0] - rp.x) * 0.2;
      rp.z += (currentPos[2] - rp.z) * 0.2;
      rp.y = getTerrainHeight(rp.x, rp.z) + 1;

      groupRef.current.position.copy(rp);

      // Face direction of travel
      const dx = currentPos[0] - pos[0];
      const dz = currentPos[2] - pos[2];
      if (dx * dx + dz * dz > 0.0001) {
        groupRef.current.rotation.y = Math.atan2(dx, dz);
      }
    }

    // ----- Fog of war -----
    if (groupRef.current) {
      const localPlayer = store.players[store.localPlayerId];
      if (localPlayer) {
        const lp = localPlayer.position;
        const rp = renderPosRef.current;
        const dxLocal = lp[0] - rp.x;
        const dzLocal = lp[2] - rp.z;
        const visibleNow = dxLocal * dxLocal + dzLocal * dzLocal < FOG_OF_WAR_RADIUS_SQ;

        if (visibleNow !== isVisibleRef.current) {
          isVisibleRef.current = visibleNow;
          groupRef.current.visible = visibleNow;

          // Discover rival's ark once the rival comes into view
          if (visibleNow) {
            store.discoverArk(playerId);
          }
        }
      }
    }
  });

  // Seed render position on first mount from store
  const initPos = useGameStore.getState().players[playerId]?.position ?? [0, 0, 0];

  return (
    <group
      ref={groupRef}
      position={[initPos[0], getTerrainHeight(initPos[0], initPos[2]) + 1, initPos[2]]}
      visible={false}
    >
      {/* Body (capsule) */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color={playerColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#C8956A" roughness={0.6} />
      </mesh>

      {/* Hood / hat accent */}
      <mesh castShadow position={[0, 1.45, -0.15]}>
        <boxGeometry args={[0.3, 0.15, 0.15]} />
        <meshStandardMaterial color={playerColor} roughness={0.8} />
      </mesh>

      {/* Staff */}
      <mesh castShadow position={[0.45, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>

      {/* Name label */}
      <Html
        center
        position={[0, 2.2, 0]}
        style={{ pointerEvents: 'none' }}
        occlude={false}
      >
        <div
          style={{
            background: playerColor + 'D9', // player color at ~85% opacity
            color: '#fff',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            border: `1px solid ${playerColor}99`,
          }}
        >
          {playerName}
        </div>
      </Html>
    </group>
  );
}
