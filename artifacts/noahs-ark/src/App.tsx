import { useGameStore } from './store/gameStore';
import { GameScene } from './game/GameScene';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { GameOverScreen } from './ui/GameOverScreen';

function App() {
  const gameState = useGameStore((s) => s.gameState);

  if (gameState === 'menu') {
    return <MainMenu />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <GameScene />
      {(gameState === 'playing') && <HUD />}
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
