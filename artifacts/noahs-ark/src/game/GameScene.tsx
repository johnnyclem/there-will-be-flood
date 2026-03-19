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
  { error: Error | null; retryCount: number }
> {
  state: { error: Error | null; retryCount: number } = { error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[GameScene] Render error caught by boundary:', error);
    if (info.componentStack) {
      console.error('[GameScene] Component stack:', info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({ error: null, retryCount: prev.retryCount + 1 }));
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error.message || 'Unknown error';
      const isWebGL = /webgl|context|gpu|shader/i.test(msg);

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
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            {isWebGL ? 'WebGL Error' : 'Rendering Error'}
          </h2>
          <p style={{ color: '#aaa', maxWidth: '400px', lineHeight: '1.6' }}>
            {isWebGL
              ? 'Could not initialize 3D rendering. Please try refreshing the page or check that your browser supports WebGL.'
              : 'Something went wrong while rendering the 3D scene.'}
          </p>
          <pre style={{
            color: '#ff6b6b',
            fontSize: '12px',
            maxWidth: '500px',
            overflow: 'auto',
            marginTop: '12px',
            padding: '8px 12px',
            background: '#1a1a2e',
            borderRadius: '6px',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg}
          </pre>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            {this.state.retryCount < 2 && (
              <button
                onClick={this.handleRetry}
                style={{
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
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 32px',
                background: '#333',
                color: '#e8d5a3',
                border: '1px solid #555',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Georgia', serif",
                fontSize: '16px',
              }}
            >
              Reload Page
            </button>
          </div>
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
