import { useGameStore, selectLocalArk, selectLocalScore } from '../store/gameStore';

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const score = useGameStore(selectLocalScore);
  const ark = useGameStore(selectLocalArk);
  const world = useGameStore((s) => s.world);
  const startGame = useGameStore((s) => s.startGame);
  const setGameState = useGameStore((s) => s.setGameState);
  const matchConfig = useGameStore((s) => s.matchConfig);
  const winnerId = useGameStore((s) => s.winnerId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const scores = useGameStore((s) => s.scores);
  const players = useGameStore((s) => s.players);

  const isVictory = gameState === 'victory';
  const isVersus = matchConfig.mode === 'versus';

  // Determine if local player won in versus mode
  const localPlayerWon = winnerId === localPlayerId;
  const winnerName = winnerId ? (players[winnerId]?.name ?? winnerId) : null;

  // Get rival scores for versus display
  const rivalEntries = Object.entries(scores)
    .filter(([id]) => id !== localPlayerId)
    .map(([id, s]) => ({ id, score: s, name: players[id]?.name ?? id }));

  const handleRestart = () => {
    startGame(matchConfig);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: isVictory
        ? 'linear-gradient(180deg, #1a2a4a 0%, #2a4a6a 30%, #87CEEB 70%, #DAA520 100%)'
        : 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 30%, #2a1a1a 60%, #1a0a0a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      fontFamily: "'Georgia', serif",
      color: 'white',
    }}>
      <h1 style={{
        fontSize: '56px',
        margin: '0 0 8px',
        letterSpacing: '6px',
        color: isVictory ? '#e8d5a3' : '#e74c3c',
        textTransform: 'uppercase',
        textShadow: isVictory
          ? '0 0 40px rgba(218,165,32,0.5)'
          : '0 0 40px rgba(231,76,60,0.5)',
      }}>
        {isVictory
          ? (isVersus ? (localPlayerWon ? 'Victory!' : 'Defeated') : 'Salvation')
          : 'The Flood Claims All'}
      </h1>

      {isVersus && isVictory && winnerName && (
        <div style={{
          fontSize: '20px',
          color: localPlayerWon ? '#e8d5a3' : '#e74c3c',
          marginBottom: '8px',
        }}>
          {localPlayerWon ? 'You built the Ark first!' : `${winnerName} completed their Ark first`}
        </div>
      )}

      <p style={{
        fontSize: '18px',
        color: 'rgba(255,255,255,0.7)',
        margin: '0 0 40px',
        maxWidth: '500px',
        textAlign: 'center',
        lineHeight: '1.6',
      }}>
        {isVictory
          ? '"And the ark rested upon the mountains of Ararat." \u2014 Genesis 8:4'
          : '"The waters prevailed exceedingly upon the earth." \u2014 Genesis 7:19'}
      </p>

      <div style={{
        background: 'rgba(0,0,0,0.5)',
        padding: '20px 30px',
        borderRadius: '10px',
        marginBottom: '40px',
        minWidth: '280px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '14px', lineHeight: '2' }}>
          <div>Your Score: <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{score}</span></div>
          <div>Days Survived: {world.dayNumber}</div>
          {ark && (
            <>
              <div>Ark Progress: {Math.round((ark.sectionsBuilt / ark.totalSections) * 100)}%</div>
              <div>Animals Saved: {ark.animalsBoarded}/{ark.totalAnimals}</div>
            </>
          )}
        </div>

        {isVersus && rivalEntries.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Rival Scores</div>
            {rivalEntries.map(({ id, score: rivalScore, name }) => (
              <div key={id} style={{ fontSize: '13px', color: id === winnerId ? '#f1c40f' : '#888' }}>
                {name}: {rivalScore} {id === winnerId ? '(Winner)' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={handleRestart}
          style={{
            padding: '14px 36px',
            fontSize: '18px',
            background: isVictory
              ? 'linear-gradient(135deg, #8B6914, #DAA520)'
              : 'linear-gradient(135deg, #c0392b, #e74c3c)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Georgia', serif",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Try Again
        </button>
        <button
          onClick={() => setGameState('menu')}
          style={{
            padding: '14px 36px',
            fontSize: '18px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Georgia', serif",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
