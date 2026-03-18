import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import type { ResourceNode } from '../store/gameStore';
import { Html } from '@react-three/drei';

const GATHER_RANGE_SQ = 16; // 4^2

function ResourceNodeMesh({ node }: { node: ResourceNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const gameState = useGameStore((s) => s.gameState);
  const [isNearby, setIsNearby] = useState(false);

  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const isSubmerged = node.position[1] < waterLevel - 0.5;

  const handleClick = useCallback(() => {
    if (isNearby && node.amount > 0) {
      useGameStore.getState().gatherResource(node.id);
    }
  }, [isNearby, node.amount, node.id]);

  // Determine if locked by another player
  const now = Date.now();
  const isLockedByOther = !!(
    node.lockedBy &&
    node.lockedUntil > now &&
    node.lockedBy !== useGameStore.getState().localPlayerId
  );

  // Check distance in useFrame to avoid re-renders from playerPos subscription
  useFrame(() => {
    if (!meshRef.current || gameState !== 'playing') return;

    const state = useGameStore.getState();
    const localPlayer = state.players[state.localPlayerId];
    if (!localPlayer) return;

    const dx = localPlayer.position[0] - node.position[0];
    const dz = localPlayer.position[2] - node.position[2];
    const nearby = dx * dx + dz * dz < GATHER_RANGE_SQ;
    setIsNearby((prev) => (prev !== nearby ? nearby : prev));

    if (hovered && node.amount > 0) {
      meshRef.current.scale.setScalar(1.1 + Math.sin(Date.now() * 0.005) * 0.05);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  if (isSubmerged || node.amount <= 0) return null;

  const colors: Record<string, string> = {
    wood: '#8B4513',
    pitch: '#2a2a2a',
    food: '#DAA520',
    gopherWood: '#D2691E',
  };

  // Locked by another player: show a muted color and different label
  const meshColor = isLockedByOther ? '#666666' : colors[node.type];

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        castShadow
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {node.type === 'wood' && <cylinderGeometry args={[0.15, 0.2, 1.5, 6]} />}
        {node.type === 'pitch' && <sphereGeometry args={[0.4, 6, 6]} />}
        {node.type === 'food' && <boxGeometry args={[0.5, 0.5, 0.5]} />}
        {node.type === 'gopherWood' && <cylinderGeometry args={[0.2, 0.25, 2, 6]} />}
        <meshStandardMaterial
          color={meshColor}
          roughness={0.8}
          emissive={hovered && isNearby && !isLockedByOther ? '#ffaa00' : '#000000'}
          emissiveIntensity={0.3}
        />
      </mesh>
      {isNearby && node.amount > 0 && (
        <Html center position={[0, 2, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: isLockedByOther ? '#ff6666' : 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}>
            {isLockedByOther
              ? `${node.type} (in use)`
              : `[E] Gather ${node.type} (${node.amount})`}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Resources() {
  // Nodes live in the store — no local state needed
  const nodes = useGameStore((s) => s.resourceNodes);

  // E key handler: gather from nearest resource within range
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const state = useGameStore.getState();
      if (state.gameState !== 'playing') return;

      const localPlayer = state.players[state.localPlayerId];
      if (!localPlayer) return;

      let nearestId = -1;
      let nearestDist = GATHER_RANGE_SQ;

      for (const node of state.resourceNodes) {
        if (node.amount <= 0) continue;
        if (node.position[1] < state.world.waterLevel - 0.5) continue;

        const dx = localPlayer.position[0] - node.position[0];
        const dz = localPlayer.position[2] - node.position[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearestId = node.id;
        }
      }

      if (nearestId >= 0) {
        useGameStore.getState().gatherResource(nearestId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <group>
      {nodes.map((node) => (
        <ResourceNodeMesh
          key={node.id}
          node={node}
        />
      ))}
    </group>
  );
}
