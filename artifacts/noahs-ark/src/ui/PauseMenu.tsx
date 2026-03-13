import { useGameStore } from '../store/gameStore';

export function PauseMenu() {
  const resumeGame = useGameStore((s) => s.resumeGame);
  const setGameState = useGameStore((s) => s.setGameState);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: "'Georgia', serif",
      color: 'white',
      backdropFilter: 'blur(4px)',
    }}>
      <h2 style={{
        fontSize: '42px',
        margin: '0 0 40px',
        letterSpacing: '4px',
        color: '#e8d5a3',
      }}>
        PAUSED
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <MenuButton onClick={resumeGame} label="Resume" />
        <MenuButton onClick={() => setGameState('menu')} label="Main Menu" />
      </div>

      <p style={{
        position: 'absolute',
        bottom: '30px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
      }}>
        Press ESC to resume
      </p>
    </div>
  );
}

function MenuButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 40px',
        fontSize: '18px',
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: "'Georgia', serif",
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transition: 'all 0.2s',
        minWidth: '220px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        e.currentTarget.style.borderColor = 'rgba(218,165,32,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      }}
    >
      {label}
    </button>
  );
}
