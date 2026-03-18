import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';

const ARK_LENGTH = 18;
const ARK_WIDTH = 5;
const ARK_HEIGHT = 4;

/** Fog of war: rival ark 3D model only shows within this distance of local player. */
const FOG_OF_WAR_RADIUS = 30;
const FOG_OF_WAR_RADIUS_SQ = FOG_OF_WAR_RADIUS * FOG_OF_WAR_RADIUS;

interface RivalArkProps {
  playerId: string;
}

export function RivalArk({ playerId }: RivalArkProps) {
  const arkPosition = useGameStore((s) => s.arks[playerId]?.position ?? null);
  const sectionsBuilt = useGameStore((s) => s.arks[playerId]?.sectionsBuilt ?? 0);
  const totalSections = useGameStore((s) => s.arks[playerId]?.totalSections ?? 1);
  const pitchCoated = useGameStore((s) => s.arks[playerId]?.pitchCoated ?? 0);
  const waterLevel = useGameStore((s) => s.world.waterLevel);

  // Sections array for rendering individual wall panels
  const sections = useMemo(() => {
    const result: { offset: number; index: number }[] = [];
    const sectionWidth = ARK_LENGTH / totalSections;
    for (let i = 0; i < totalSections; i++) {
      result.push({
        offset: -ARK_LENGTH / 2 + sectionWidth * i + sectionWidth / 2,
        index: i,
      });
    }
    return result;
  }, [totalSections]);

  // Don't render if not yet placed
  if (!arkPosition) return null;

  const terrainY = getTerrainHeight(arkPosition[0], arkPosition[2]);
  const buildProgress = sectionsBuilt / totalSections;

  return (
    <group position={[arkPosition[0], terrainY, arkPosition[2]]}>
      <RivalArkInner
        terrainY={terrainY}
        waterLevel={waterLevel}
        buildProgress={buildProgress}
        sectionsBuilt={sectionsBuilt}
        pitchCoated={pitchCoated}
        sections={sections}
        totalSections={totalSections}
        playerId={playerId}
      />
    </group>
  );
}

interface RivalArkInnerProps {
  terrainY: number;
  waterLevel: number;
  buildProgress: number;
  sectionsBuilt: number;
  pitchCoated: number;
  sections: { offset: number; index: number }[];
  totalSections: number;
  playerId: string;
}

function RivalArkInner({
  terrainY,
  waterLevel,
  buildProgress,
  sectionsBuilt,
  pitchCoated,
  sections,
  totalSections,
  playerId,
}: RivalArkInnerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isVisibleRef = useRef(false);

  const sectionWidth = ARK_LENGTH / totalSections;

  useFrame((state) => {
    if (!groupRef.current) return;

    // Fog of war visibility check
    const store = useGameStore.getState();
    const localPlayer = store.players[store.localPlayerId];
    const arkPos = store.arks[playerId]?.position;

    if (localPlayer && arkPos) {
      const lp = localPlayer.position;
      const dx = lp[0] - arkPos[0];
      const dz = lp[2] - arkPos[2];
      const inRange = dx * dx + dz * dz < FOG_OF_WAR_RADIUS_SQ;

      // Also always visible once discovered
      const discovered = store.discoveredArkIds.includes(playerId);

      const shouldBeVisible = inRange || discovered;
      if (shouldBeVisible !== isVisibleRef.current) {
        isVisibleRef.current = shouldBeVisible;
        groupRef.current.visible = shouldBeVisible;
      }
    }

    // Floating animation when water rises
    const baseY = Math.max(terrainY, waterLevel - 0.5);
    const floatY =
      waterLevel > terrainY + 1 && buildProgress > 0.3
        ? waterLevel + 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
        : baseY;

    groupRef.current.position.y += (floatY - groupRef.current.position.y) * 0.02;

    if (waterLevel > terrainY + 1 && buildProgress > 0.3) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.31) * 0.02;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.41) * 0.015;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Hull — rival ark tinted slightly red to distinguish */}
      <mesh receiveShadow castShadow position={[0, ARK_HEIGHT * 0.3 * buildProgress / 2, 0]}>
        <boxGeometry
          args={[
            ARK_LENGTH * Math.min(1, buildProgress * 1.5),
            ARK_HEIGHT * 0.3 * buildProgress,
            ARK_WIDTH,
          ]}
        />
        <meshStandardMaterial color="#5a2a18" roughness={0.9} />
      </mesh>

      {/* Wall sections */}
      {sections.map((section) => {
        if (section.index >= sectionsBuilt) return null;
        const isCoated = section.index < pitchCoated;

        return (
          <group key={section.index} position={[section.offset, 0, 0]}>
            {/* Front wall */}
            <mesh castShadow position={[0, ARK_HEIGHT * 0.3 + 0.5, -ARK_WIDTH / 2]}>
              <boxGeometry args={[sectionWidth * 0.95, ARK_HEIGHT * 0.6, 0.15]} />
              <meshStandardMaterial
                color={isCoated ? '#111111' : '#7B3226'}
                roughness={isCoated ? 0.3 : 0.9}
              />
            </mesh>
            {/* Back wall */}
            <mesh castShadow position={[0, ARK_HEIGHT * 0.3 + 0.5, ARK_WIDTH / 2]}>
              <boxGeometry args={[sectionWidth * 0.95, ARK_HEIGHT * 0.6, 0.15]} />
              <meshStandardMaterial
                color={isCoated ? '#111111' : '#7B3226'}
                roughness={isCoated ? 0.3 : 0.9}
              />
            </mesh>
          </group>
        );
      })}

      {/* Deck (> 50% progress) */}
      {buildProgress > 0.5 && (
        <mesh castShadow position={[0, ARK_HEIGHT * 0.6 + 0.5, 0]}>
          <boxGeometry args={[ARK_LENGTH * 0.9, 0.15, ARK_WIDTH * 0.9]} />
          <meshStandardMaterial color="#6C3033" roughness={0.85} />
        </mesh>
      )}

      {/* Upper room (> 80% progress) */}
      {buildProgress > 0.8 && (
        <group position={[0, ARK_HEIGHT * 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[ARK_LENGTH * 0.85, ARK_HEIGHT * 0.3, ARK_WIDTH * 0.85]} />
            <meshStandardMaterial color="#6C3D2E" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, ARK_HEIGHT * 0.2, 0]}>
            <boxGeometry args={[ARK_LENGTH * 0.7, 0.1, ARK_WIDTH * 0.7]} />
            <meshStandardMaterial color="#5a2a18" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* Roof (100% complete) */}
      {buildProgress >= 1 && (
        <group position={[0, ARK_HEIGHT * 1.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[ARK_LENGTH * 0.6, ARK_HEIGHT * 0.25, ARK_WIDTH * 0.6]} />
            <meshStandardMaterial color="#6C3D2E" roughness={0.9} />
          </mesh>
          <mesh
            castShadow
            position={[0, ARK_HEIGHT * 0.25, 0]}
            rotation={[0, 0, Math.PI / 12]}
          >
            <boxGeometry args={[ARK_LENGTH * 0.55, 0.08, ARK_WIDTH * 0.55]} />
            <meshStandardMaterial color="#5a2a18" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* Prow ornament */}
      <mesh castShadow position={[ARK_LENGTH * 0.48, ARK_HEIGHT * 0.2, 0]}>
        <coneGeometry args={[ARK_WIDTH * 0.4, 3, 4]} />
        <meshStandardMaterial color="#6C4033" roughness={0.9} />
      </mesh>
    </group>
  );
}
