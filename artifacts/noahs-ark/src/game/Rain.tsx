import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, selectLocalPlayer } from "../store/gameStore";

const MAX_PARTICLES = 3000;

export function Rain() {
  const pointsRef = useRef<THREE.Points>(null);
  const stormIntensity = useGameStore((s) => s.world.stormIntensity);
  const playerPos = useGameStore((s) => selectLocalPlayer(s)?.position ?? [0, 0, 0] as [number, number, number]);
  const gameState = useGameStore((s) => s.gameState);
  const updateStormIntensity = useGameStore((s) => s.updateStormIntensity);
  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const lastIntensityRef = useRef(-1);

  const particleData = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 30 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities[i] = 15 + Math.random() * 10;
    }
    return { positions, velocities };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || gameState !== "playing") return;

    const newIntensity = Math.min(1, Math.max(0, (waterLevel + 2) / 15));
    if (Math.abs(newIntensity - lastIntensityRef.current) > 0.01) {
      lastIntensityRef.current = newIntensity;
      updateStormIntensity(newIntensity);
    }

    const activeCount = Math.floor(MAX_PARTICLES * stormIntensity);
    const positions = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < activeCount) {
        positions.array[i * 3 + 1] -= particleData.velocities[i] * delta;

        if (positions.array[i * 3 + 1] < waterLevel) {
          positions.array[i * 3] = playerPos[0] + (Math.random() - 0.5) * 60;
          positions.array[i * 3 + 1] = playerPos[1] + Math.random() * 25 + 10;
          positions.array[i * 3 + 2] =
            playerPos[2] + (Math.random() - 0.5) * 60;
        }

        positions.array[i * 3] +=
          (Math.random() - 0.5) * delta * stormIntensity * 3;
      } else {
        positions.array[i * 3 + 1] = -100;
      }
    }

    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aaccee"
        size={0.08}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
