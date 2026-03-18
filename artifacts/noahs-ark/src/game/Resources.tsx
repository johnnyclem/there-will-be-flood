import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';
import { Html } from '@react-three/drei';

interface ResourceNode {
  id: number;
  position: [number, number, number];
  type: 'wood' | 'pitch' | 'food' | 'gopherWood';
  amount: number;
  maxAmount: number;
  respawnTime: number;
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

const GATHER_RANGE_SQ = 16; // 4^2

function ResourceNodeMesh({ node, onGather }: { node: ResourceNode; onGather: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const gameState = useGameStore((s) => s.gameState);
  const [isNearby, setIsNearby] = useState(false);

  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const isSubmerged = node.position[1] < waterLevel - 0.5;

  // Check distance in useFrame to avoid re-renders from playerPos subscription
  useFrame(() => {
    if (!meshRef.current || gameState !== 'playing') return;

    const { player } = useGameStore.getState();
    const dx = player.position[0] - node.position[0];
    const dz = player.position[2] - node.position[2];
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

  const handleClick = useCallback(() => {
    if (isNearby && node.amount > 0) {
      onGather();
    }
  }, [isNearby, node.amount, onGather]);

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
          color={colors[node.type]}
          roughness={0.8}
          emissive={hovered && isNearby ? '#ffaa00' : '#000000'}
          emissiveIntensity={0.3}
        />
      </mesh>
      {isNearby && node.amount > 0 && (
        <Html center position={[0, 2, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}>
            [E] Gather {node.type} ({node.amount})
          </div>
        </Html>
      )}
    </group>
  );
}

export function Resources() {
  const addResource = useGameStore((s) => s.addResource);
  const updateFaith = useGameStore((s) => s.updateFaith);

  const [nodes, setNodes] = useState<ResourceNode[]>(() => {
    const result: ResourceNode[] = [];
    const rng = mulberry32(54321);
    let id = 0;

    // Wood: 50 nodes (increased from 40) with more per node
    for (let i = 0; i < 50; i++) {
      const x = (rng() - 0.5) * 140;
      const z = (rng() - 0.5) * 140;
      const y = getTerrainHeight(x, z);
      if (y < -1) continue;
      result.push({
        id: id++,
        position: [x, y + 0.7, z],
        type: 'wood',
        amount: 5 + Math.floor(rng() * 6),
        maxAmount: 10,
        respawnTime: 0,
      });
    }

    for (let i = 0; i < 15; i++) {
      const x = (rng() - 0.5) * 140;
      const z = (rng() - 0.5) * 140;
      const y = getTerrainHeight(x, z);
      if (y < -1) continue;
      result.push({
        id: id++,
        position: [x, y + 0.3, z],
        type: 'pitch',
        amount: 2 + Math.floor(rng() * 3),
        maxAmount: 5,
        respawnTime: 0,
      });
    }

    for (let i = 0; i < 20; i++) {
      const x = (rng() - 0.5) * 120;
      const z = (rng() - 0.5) * 120;
      const y = getTerrainHeight(x, z);
      if (y < -1) continue;
      result.push({
        id: id++,
        position: [x, y + 0.3, z],
        type: 'food',
        amount: 2 + Math.floor(rng() * 4),
        maxAmount: 6,
        respawnTime: 0,
      });
    }

    for (let i = 0; i < 8; i++) {
      const x = (rng() - 0.5) * 160;
      const z = (rng() - 0.5) * 160;
      const y = getTerrainHeight(x, z);
      if (y < 3) continue;
      result.push({
        id: id++,
        position: [x, y + 0.9, z],
        type: 'gopherWood',
        amount: 1 + Math.floor(rng() * 2),
        maxAmount: 3,
        respawnTime: 0,
      });
    }

    return result;
  });

  const handleGather = useCallback((nodeId: number) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId || n.amount <= 0) return n;
        addResource(n.type, 1);
        updateFaith(1);
        return { ...n, amount: n.amount - 1 };
      })
    );
  }, [addResource, updateFaith]);

  // E key handler: gather from nearest resource within range
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const { gameState, player } = useGameStore.getState();
      if (gameState !== 'playing') return;

      let nearestId = -1;
      let nearestDist = GATHER_RANGE_SQ;

      for (const node of nodesRef.current) {
        if (node.amount <= 0) continue;
        const waterLevel = useGameStore.getState().world.waterLevel;
        if (node.position[1] < waterLevel - 0.5) continue;

        const dx = player.position[0] - node.position[0];
        const dz = player.position[2] - node.position[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearestId = node.id;
        }
      }

      if (nearestId >= 0) {
        handleGather(nearestId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGather]);

  return (
    <group>
      {nodes.map((node) => (
        <ResourceNodeMesh
          key={node.id}
          node={node}
          onGather={() => handleGather(node.id)}
        />
      ))}
    </group>
  );
}
