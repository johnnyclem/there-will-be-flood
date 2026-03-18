import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, selectLocalArk } from '../store/gameStore';
import { getTerrainHeight } from './Terrain';

const ARK_LENGTH = 18;
const ARK_WIDTH = 5;
const ARK_HEIGHT = 4;

export function Ark() {
  const groupRef = useRef<THREE.Group>(null);
  const sectionsBuilt = useGameStore((s) => selectLocalArk(s)?.sectionsBuilt ?? 0);
  const totalSections = useGameStore((s) => selectLocalArk(s)?.totalSections ?? 30);
  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const pitchCoated = useGameStore((s) => selectLocalArk(s)?.pitchCoated ?? 0);
  const arkPosition = useGameStore((s) => selectLocalArk(s)?.position ?? null);

  const buildProgress = sectionsBuilt / totalSections;

  // useMemo must be called before any early return (React rules of hooks)
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

  // Don't render if ark hasn't been placed yet
  if (!arkPosition) return null;

  const terrainY = getTerrainHeight(arkPosition[0], arkPosition[2]);

  return (
    <group position={[arkPosition[0], terrainY, arkPosition[2]]}>
      <ArkInner
        groupRef={groupRef}
        terrainY={terrainY}
        waterLevel={waterLevel}
        buildProgress={buildProgress}
        sectionsBuilt={sectionsBuilt}
        pitchCoated={pitchCoated}
        sections={sections}
        totalSections={totalSections}
      />
    </group>
  );
}

function ArkInner({
  groupRef,
  terrainY,
  waterLevel,
  buildProgress,
  sectionsBuilt,
  pitchCoated,
  sections,
  totalSections,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  terrainY: number;
  waterLevel: number;
  buildProgress: number;
  sectionsBuilt: number;
  pitchCoated: number;
  sections: { offset: number; index: number }[];
  totalSections: number;
}) {
  useFrame((state) => {
    if (!groupRef.current) return;

    const baseY = Math.max(terrainY, waterLevel - 0.5);
    const floatY = waterLevel > terrainY + 1 && buildProgress > 0.3
      ? waterLevel + 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
      : baseY;

    groupRef.current.position.y += (floatY - groupRef.current.position.y) * 0.02;

    if (waterLevel > terrainY + 1 && buildProgress > 0.3) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.015;
    }
  });

  const sectionWidth = ARK_LENGTH / totalSections;

  return (
    <group ref={groupRef}>
      <mesh receiveShadow castShadow position={[0, ARK_HEIGHT * 0.3 * buildProgress / 2, 0]}>
        <boxGeometry args={[ARK_LENGTH * Math.min(1, buildProgress * 1.5), ARK_HEIGHT * 0.3 * buildProgress, ARK_WIDTH]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </mesh>

      {sections.map((section) => {
        if (section.index >= sectionsBuilt) return null;
        const isCoated = section.index < pitchCoated;

        return (
          <group key={section.index} position={[section.offset, 0, 0]}>
            <mesh castShadow position={[0, ARK_HEIGHT * 0.3 + 0.5, -ARK_WIDTH / 2]}>
              <boxGeometry args={[sectionWidth * 0.95, ARK_HEIGHT * 0.6, 0.15]} />
              <meshStandardMaterial
                color={isCoated ? '#1a1a1a' : '#6B4226'}
                roughness={isCoated ? 0.3 : 0.9}
              />
            </mesh>
            <mesh castShadow position={[0, ARK_HEIGHT * 0.3 + 0.5, ARK_WIDTH / 2]}>
              <boxGeometry args={[sectionWidth * 0.95, ARK_HEIGHT * 0.6, 0.15]} />
              <meshStandardMaterial
                color={isCoated ? '#1a1a1a' : '#6B4226'}
                roughness={isCoated ? 0.3 : 0.9}
              />
            </mesh>
          </group>
        );
      })}

      {buildProgress > 0.5 && (
        <mesh castShadow position={[0, ARK_HEIGHT * 0.6 + 0.5, 0]}>
          <boxGeometry args={[ARK_LENGTH * 0.9, 0.15, ARK_WIDTH * 0.9]} />
          <meshStandardMaterial color="#5C4033" roughness={0.85} />
        </mesh>
      )}

      {buildProgress > 0.8 && (
        <group position={[0, ARK_HEIGHT * 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[ARK_LENGTH * 0.85, ARK_HEIGHT * 0.3, ARK_WIDTH * 0.85]} />
            <meshStandardMaterial color="#5C3D2E" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, ARK_HEIGHT * 0.2, 0]}>
            <boxGeometry args={[ARK_LENGTH * 0.7, 0.1, ARK_WIDTH * 0.7]} />
            <meshStandardMaterial color="#4a3520" roughness={0.85} />
          </mesh>
        </group>
      )}

      {buildProgress >= 1 && (
        <group position={[0, ARK_HEIGHT * 1.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[ARK_LENGTH * 0.6, ARK_HEIGHT * 0.25, ARK_WIDTH * 0.6]} />
            <meshStandardMaterial color="#5C3D2E" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, ARK_HEIGHT * 0.25, 0]} rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[ARK_LENGTH * 0.55, 0.08, ARK_WIDTH * 0.55]} />
            <meshStandardMaterial color="#4a3520" roughness={0.85} />
          </mesh>
        </group>
      )}

      <mesh castShadow position={[ARK_LENGTH * 0.48, ARK_HEIGHT * 0.2, 0]}>
        <coneGeometry args={[ARK_WIDTH * 0.4, 3, 4]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>
    </group>
  );
}
