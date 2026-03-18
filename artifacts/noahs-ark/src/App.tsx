import { useGameStore } from './store/gameStore';
import { GameScene } from './game/GameScene';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { BuildMenu } from './ui/BuildMenu';
import { PauseMenu } from './ui/PauseMenu';
import { GameOverScreen } from './ui/GameOverScreen';
import { BackgroundMusic } from './ui/BackgroundMusic';
import { Tutorial } from './ui/Tutorial';

function App() {
  const gameState = useGameStore((s) => s.gameState);
  const resetCounter = useGameStore((s) => s.resetCounter);
  const buildMenuOpen = useGameStore((s) => s.buildMenuOpen);

  if (gameState === 'menu') {
    return <MainMenu />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <GameScene key={resetCounter} />
      <BackgroundMusic />
      {(gameState === 'playing') && <HUD />}
      {(gameState === 'playing') && buildMenuOpen && <BuildMenu />}
      {(gameState === 'playing' || gameState === 'paused') && <Tutorial key={resetCounter} />}
      {gameState === 'paused' && (
        <>
          <HUD />
          <PauseMenu />
        </>
      )}
      {(gameState === 'gameover' || gameState === 'victory') && <GameOverScreen />}
    </div>
  );
}

export default App;
