import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const MIN_DISTANCE = 8;
const MAX_DISTANCE = 40;
const MIN_TILT = 0.3;
const MAX_TILT = 1.2;
const CAMERA_SMOOTHING = 0.05;

// Reusable vectors to avoid GC pressure
const _target = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();

export function GameCamera() {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());
  const [distance, setDistance] = useState(18);
  const [tilt, setTilt] = useState(0.7);
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const gameState = useGameStore((s) => s.gameState);
  const setCameraRotation = useGameStore((s) => s.setCameraRotation);
  const cameraShake = useGameStore((s) => s.cameraShake);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (gameState !== 'playing') return;
      e.preventDefault();
      setDistance((d) => Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, d + e.deltaY * 0.02)));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      setRotation((r) => r - dx * 0.005);
      setTilt((t) => Math.max(MIN_TILT, Math.min(MAX_TILT, t + dy * 0.005)));
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('contextmenu', handleContextMenu);
    }
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState]);

  const lastRotationRef = useRef(rotation);

  useFrame(() => {
    if (gameState !== 'playing') return;

    const state = useGameStore.getState();
    const localPlayer = state.players[state.localPlayerId];
    const playerPos = localPlayer?.position ?? [0, 0, 0] as [number, number, number];
    _target.set(playerPos[0], playerPos[1], playerPos[2]);
    targetRef.current.lerp(_target, CAMERA_SMOOTHING);

    const offsetX = Math.sin(rotation) * Math.cos(tilt) * distance;
    const offsetY = Math.sin(tilt) * distance;
    const offsetZ = Math.cos(rotation) * Math.cos(tilt) * distance;

    _cameraPos.set(
      targetRef.current.x + offsetX,
      targetRef.current.y + offsetY,
      targetRef.current.z + offsetZ
    );

    // Apply camera shake
    const shake = useGameStore.getState().cameraShake;
    if (shake > 0.01) {
      _cameraPos.x += (Math.random() - 0.5) * shake * 0.5;
      _cameraPos.y += (Math.random() - 0.5) * shake * 0.3;
      _cameraPos.z += (Math.random() - 0.5) * shake * 0.5;
      // Decay the shake each frame (~halves every 0.5s at 60fps)
      useGameStore.setState({ cameraShake: shake * 0.92 });
    }

    camera.position.lerp(_cameraPos, 0.08);
    camera.lookAt(targetRef.current);

    // Only update store when rotation actually changed
    if (rotation !== lastRotationRef.current) {
      lastRotationRef.current = rotation;
      setCameraRotation(rotation);
    }
  });

  return null;
}
