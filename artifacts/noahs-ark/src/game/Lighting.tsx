import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function Lighting() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const stormIntensity = useGameStore((s) => s.world.stormIntensity);

  useFrame(() => {
    if (!dirLightRef.current) return;
    const intensity = 1.5 - stormIntensity * 0.8;
    dirLightRef.current.intensity = intensity;
  });

  return (
    <>
      <ambientLight intensity={0.3 - stormIntensity * 0.15} color="#b8c4d4" />
      <directionalLight
        ref={dirLightRef}
        position={[50, 80, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight
        args={['#87CEEB', '#3a5a1e', 0.4]}
      />
      {stormIntensity > 0.6 && (
        <pointLight
          position={[0, 50, 0]}
          intensity={stormIntensity * 2}
          color="#ccddff"
          distance={200}
        />
      )}
    </>
  );
}

export function Fog() {
  const stormIntensity = useGameStore((s) => s.world.stormIntensity);

  const near = 30 - stormIntensity * 15;
  const far = 120 - stormIntensity * 50;
  const fogColor = new THREE.Color().lerpColors(
    new THREE.Color('#87CEEB'),
    new THREE.Color('#555566'),
    stormIntensity
  );

  return <fog attach="fog" args={[fogColor, near, far]} />;
}
