import { Component, type ReactNode } from 'react';
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
import { RivalPlayer } from './RivalPlayer';
import { RivalArk } from './RivalArk';
import { useGameStore, selectRivalIds } from '../store/gameStore';

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#e8d5a3',
          fontFamily: "'Georgia', serif",
          textAlign: 'center',
          padding: '40px',
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            WebGL Error
          </h2>
          <p style={{ color: '#aaa', maxWidth: '400px', lineHeight: '1.6' }}>
            Could not initialize 3D rendering. Please try refreshing the page
            or check that your browser supports WebGL.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #8B6914, #DAA520)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: "'Georgia', serif",
              fontSize: '16px',
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

function RivalEntities() {
  const rivalIds = useGameStore(selectRivalIds);
  return (
    <>
      {rivalIds.map((id) => (
        <group key={id}>
          <RivalPlayer playerId={id} />
          <RivalArk playerId={id} />
        </group>
      ))}
    </>
  );
}

export function GameScene() {
  return (
    <CanvasErrorBoundary>
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{ position: [0, 20, 25], fov: 55 }}
          style={{ width: '100vw', height: '100vh' }}
          gl={{ antialias: true, failIfMajorPerformanceCaveat: false }}
          onCreated={({ gl }) => {
            // Suppress WebGL warnings from triggering the runtime error overlay
            gl.debug.checkShaderErrors = false;
          }}
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
          <RivalEntities />
          <GameCamera />
          <Rain />
        </Canvas>
        <InteractionSystem />
      </KeyboardControls>
    </CanvasErrorBoundary>
  );
}
