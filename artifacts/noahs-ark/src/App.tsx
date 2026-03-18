import { useGameStore } from './store/gameStore';
import { GameScene } from './game/GameScene';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { BuildMenu } from './ui/BuildMenu';
import { PauseMenu } from './ui/PauseMenu';
import { GameOverScreen } from './ui/GameOverScreen';
import { BackgroundMusic } from './ui/BackgroundMusic';
import { Tutorial } from './ui/Tutorial';
import { Minimap } from './ui/Minimap';
import { Scoreboard } from './ui/Scoreboard';
import { DivineIntervention } from './ui/DivineIntervention';

function App() {
  const gameState = useGameStore((s) => s.gameState);
  const resetCounter = useGameStore((s) => s.resetCounter);
  const buildMenuOpen = useGameStore((s) => s.buildMenuOpen);
  const matchConfig = useGameStore((s) => s.matchConfig);
  const showDivineIntervention = useGameStore((s) => s.showDivineIntervention);
  const scoreboardOpen = useGameStore((s) => s.scoreboardOpen);

  const isPlaying = gameState === 'playing';

  if (gameState === 'menu') {
    return <MainMenu />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <GameScene key={resetCounter} />
      <BackgroundMusic />
      {isPlaying && <HUD />}
      {isPlaying && buildMenuOpen && <BuildMenu />}
      {isPlaying && matchConfig.mode === 'versus' && <Minimap />}
      {(isPlaying || gameState === 'paused') && <Tutorial key={resetCounter} />}
      {gameState === 'paused' && (
        <>
          <HUD />
          <PauseMenu />
        </>
      )}
      {(gameState === 'gameover' || gameState === 'victory') && <GameOverScreen />}
      {scoreboardOpen && <Scoreboard />}
      {showDivineIntervention && <DivineIntervention />}
    </div>
  );
}

export default App;
