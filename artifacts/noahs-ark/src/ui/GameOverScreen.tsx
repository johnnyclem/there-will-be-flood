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
  const arks = useGameStore((s) => s.arks);
  const animalStates = useGameStore((s) => s.animalStates);

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
        padding: '24px 30px',
        borderRadius: '10px',
        marginBottom: '40px',
        minWidth: '340px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#e8d5a3', marginBottom: '12px' }}>
          Score Breakdown
        </div>
        <div style={{ fontSize: '13px', lineHeight: '2' }}>
          {ark && (
            <>
              {ark.position && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ark Placement</span>
                  <span style={{ color: '#2ecc71' }}>+50</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sections Built ({ark.sectionsBuilt}/{ark.totalSections})</span>
                <span style={{ color: '#2ecc71' }}>+{ark.sectionsBuilt * 100}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pitch Coating ({ark.pitchCoated})</span>
                <span style={{ color: '#2ecc71' }}>+{ark.pitchCoated * 50}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Animals Boarded ({ark.animalsBoarded}/{ark.totalAnimals})</span>
                <span style={{ color: '#2ecc71' }}>+{ark.animalsBoarded * 200}</span>
              </div>
            </>
          )}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.15)',
            marginTop: '6px',
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '15px',
          }}>
            <span>Total Score</span>
            <span style={{ color: '#f1c40f' }}>{score}</span>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '12px',
          paddingTop: '10px',
          fontSize: '13px',
          color: '#aaa',
        }}>
          <div>Days Survived: {world.dayNumber}</div>
          <div>Time: ~{Math.round(world.dayNumber * 60 / 60)}m {world.dayNumber * 60 % 60}s</div>
          <div>Final Water Level: {world.waterLevel.toFixed(1)}</div>
        </div>

        {isVersus && (
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8d5a3', marginBottom: '8px' }}>Rival Comparison</div>
            {rivalEntries.map(({ id, score: rivalScore, name }) => {
              const rivalArk = arks[id];
              const rivalSpecies = animalStates
                .filter((a) => a.boardedByPlayerId === id)
                .map((a) => a.species);
              return (
                <div key={id} style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <div style={{ color: id === winnerId ? '#f1c40f' : '#aaa', fontWeight: 'bold', marginBottom: '4px' }}>
                    {name}: {rivalScore} pts {id === winnerId ? '(Winner)' : ''}
                  </div>
                  {rivalArk && (
                    <div style={{ color: '#777', paddingLeft: '10px' }}>
                      <div>Sections: {rivalArk.sectionsBuilt}/{rivalArk.totalSections} | Animals: {rivalArk.animalsBoarded}/{rivalArk.totalAnimals}</div>
                      {rivalSpecies.length > 0 && (
                        <div>Species: {rivalSpecies.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const localSpecies = animalStates
                .filter((a) => a.boardedByPlayerId === localPlayerId)
                .map((a) => a.species);
              const rivalSpeciesAll = rivalEntries.flatMap(({ id }) =>
                animalStates.filter((a) => a.boardedByPlayerId === id).map((a) => a.species),
              );
              const uniqueToLocal = localSpecies.filter((s) => !rivalSpeciesAll.includes(s));
              const shared = localSpecies.filter((s) => rivalSpeciesAll.includes(s));
              return localSpecies.length > 0 ? (
                <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: '4px' }}>Your Species</div>
                  <div style={{ color: '#777', paddingLeft: '10px' }}>
                    {uniqueToLocal.length > 0 && <div style={{ color: '#2ecc71' }}>Exclusive: {uniqueToLocal.join(', ')}</div>}
                    {shared.length > 0 && <div>Shared: {shared.join(', ')}</div>}
                  </div>
                </div>
              ) : null;
            })()}
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
