import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Terrain } from './Terrain';
import { Water } from './Water';
import { Player, Controls } from './Player';
import { GameCamera } from './Camera';
import { Rain } from './Rain';
import { Trees } from './Trees';
import { Ark } from './Ark';
import { Animals } from './Animals';
import { Resources } from './Resources';
import { Lighting, Fog } from './Lighting';
import { InteractionSystem } from './InteractionSystem';

const keyMap = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.sprint, keys: ['ShiftLeft', 'ShiftRight'] },
  { name: Controls.interact, keys: ['KeyE'] },
  { name: Controls.attack, keys: ['Space'] },
  { name: Controls.tool1, keys: ['Digit1'] },
  { name: Controls.tool2, keys: ['Digit2'] },
  { name: Controls.tool3, keys: ['Digit3'] },
];

export function GameScene() {
  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        camera={{ position: [0, 20, 25], fov: 55 }}
        style={{ width: '100vw', height: '100vh' }}
        gl={{ antialias: true }}
      >
        <Fog />
        <Lighting />
        <Terrain />
        <Water />
        <Trees />
        <Ark />
        <Animals />
        <Resources />
        <Player />
        <GameCamera />
        <Rain />
      </Canvas>
      <InteractionSystem />
    </KeyboardControls>
  );
}
