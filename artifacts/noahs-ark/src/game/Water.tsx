import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function Water() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const waterLevel = useGameStore((s) => s.world.waterLevel);
  const gameState = useGameStore((s) => s.gameState);
  const updateWaterLevel = useGameStore((s) => s.updateWaterLevel);
  const waterRiseRate = useGameStore((s) => s.world.waterRiseRate);

  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    updateWaterLevel(waterRiseRate * delta);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float wave1 = sin(pos.x * 0.3 + uTime * 0.8) * 0.3;
      float wave2 = sin(pos.y * 0.4 + uTime * 1.2) * 0.2;
      float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * 0.5) * 0.15;
      pos.z += wave1 + wave2 + wave3;
      vElevation = wave1 + wave2 + wave3;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vec3 deepColor = vec3(0.05, 0.15, 0.35);
      vec3 shallowColor = vec3(0.1, 0.4, 0.6);
      vec3 foamColor = vec3(0.7, 0.85, 0.95);

      float mixFactor = (vElevation + 0.5) * 0.8;
      vec3 color = mix(deepColor, shallowColor, clamp(mixFactor, 0.0, 1.0));

      float foam = smoothstep(0.3, 0.5, vElevation);
      color = mix(color, foamColor, foam * 0.4);

      float alpha = 0.75 + vElevation * 0.1;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterLevel, 0]}
    >
      <planeGeometry args={[300, 300, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        uniforms={{
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
}
