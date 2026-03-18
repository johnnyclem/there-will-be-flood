import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';
import { resolveCollisions } from './colliders';

export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  sprint = 'sprint',
  interact = 'interact',
  attack = 'attack',
  tool1 = 'tool1',
  tool2 = 'tool2',
  tool3 = 'tool3',
}

const WALK_SPEED = 8;
const SPRINT_SPEED = 14;
const SWIM_SPEED = 4;
const STAMINA_DRAIN = 15;
const STAMINA_REGEN = 10;

// Reusable vectors to avoid GC pressure
const _direction = new THREE.Vector3();
const _zero = new THREE.Vector3(0, 0, 0);

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const [, getState] = useKeyboardControls<Controls>();

  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const updateStamina = useGameStore((s) => s.updateStamina);
  const switchTool = useGameStore((s) => s.switchTool);
  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const gameState = useGameStore((s) => s.gameState);
  const stamina = useGameStore((s) => s.player.stamina);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === '1') switchTool('axe');
      if (e.key === '2') switchTool('hammer');
      if (e.key === '3') switchTool('staff');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, switchTool]);

  useFrame((_, delta) => {
    if (!groupRef.current || gameState !== 'playing') return;

    const controls = getState();
    const pos = groupRef.current.position;

    // Sample terrain at current position for speed/swimming check
    let terrainY = getTerrainHeight(pos.x, pos.z);
    const isSwimming = terrainY < waterLevel - 0.5;
    const isSprinting = controls.sprint && stamina > 0 && !isSwimming;

    let speed = isSwimming ? SWIM_SPEED : isSprinting ? SPRINT_SPEED : WALK_SPEED;
    _direction.set(0, 0, 0);

    if (controls.forward) _direction.z -= 1;
    if (controls.back) _direction.z += 1;
    if (controls.left) _direction.x -= 1;
    if (controls.right) _direction.x += 1;

    if (_direction.length() > 0) {
      _direction.normalize();
      velocityRef.current.lerp(_direction.multiplyScalar(speed), 0.15);
    } else {
      velocityRef.current.lerp(_zero, 0.2);
    }

    pos.x += velocityRef.current.x * delta;
    pos.z += velocityRef.current.z * delta;

    // Resolve collisions with trees, rocks, and the ark
    const [resolvedX, resolvedZ] = resolveCollisions(pos.x, pos.z);
    pos.x = resolvedX;
    pos.z = resolvedZ;

    // Re-sample terrain at the new position so Y tracks correctly
    terrainY = getTerrainHeight(pos.x, pos.z);
    const targetY = Math.max(terrainY, waterLevel - 0.3) + 1;
    // Frame-rate-independent smoothing: faster catch-up (rate ~10/s)
    const smoothing = 1 - Math.exp(-10 * delta);
    pos.y += (targetY - pos.y) * smoothing;

    const boundary = 90;
    pos.x = Math.max(-boundary, Math.min(boundary, pos.x));
    pos.z = Math.max(-boundary, Math.min(boundary, pos.z));

    if (velocityRef.current.length() > 0.1) {
      const angle = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      groupRef.current.rotation.y = angle;
    }

    if (isSprinting && _direction.length() > 0) {
      updateStamina(-STAMINA_DRAIN * delta);
    } else {
      updateStamina(STAMINA_REGEN * delta);
    }

    // Expose diagnostic data for testing
    const currentTerrainY = getTerrainHeight(pos.x, pos.z);
    (window as any).__PLAYER_DEBUG__ = {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      terrainY: currentTerrainY,
      targetY: Math.max(currentTerrainY, waterLevel - 0.3) + 1,
      waterLevel,
      delta: pos.y - (currentTerrainY + 1),
    };

    setPlayerPosition([pos.x, pos.y, pos.z]);
  });

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      <mesh ref={bodyRef} castShadow position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} />
      </mesh>

      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#D4A574" roughness={0.6} />
      </mesh>

      <mesh castShadow position={[0, 1.45, -0.15]}>
        <boxGeometry args={[0.3, 0.15, 0.15]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>

      <mesh castShadow position={[0.45, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>
    </group>
  );
}
