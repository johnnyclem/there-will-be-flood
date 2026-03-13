import { useGameStore } from '../store/gameStore';

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #1a2a4a 30%, #2a3a5a 60%, #3a4a3a 80%, #1a2a1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,200,100,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '20px',
            background: 'rgba(150,180,255,0.3)',
            left: `${5 + (i * 47) % 90}%`,
            top: '-20px',
            animation: `rain ${1.5 + (i % 3) * 0.5}s linear infinite`,
            animationDelay: `${(i * 0.3) % 2}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes rain {
          0% { transform: translateY(-20px); opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,200,100,0.3); }
          50% { text-shadow: 0 0 40px rgba(255,200,100,0.6), 0 0 80px rgba(255,200,100,0.2); }
        }
      `}</style>

      <div style={{
        animation: 'float 4s ease-in-out infinite',
        textAlign: 'center',
        zIndex: 1,
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 'bold',
          margin: 0,
          letterSpacing: '4px',
          animation: 'glow 3s ease-in-out infinite',
          color: '#e8d5a3',
          textTransform: 'uppercase',
        }}>
          There Will Be Flood
        </h1>
      </div>

      <div style={{
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 1,
      }}>
        <button
          onClick={startGame}
          style={{
            padding: '16px 48px',
            fontSize: '20px',
            background: 'linear-gradient(135deg, #8B6914 0%, #DAA520 100%)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Georgia', serif",
            letterSpacing: '3px',
            textTransform: 'uppercase',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(218,165,32,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Begin Journey
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        zIndex: 1,
      }}>
        <p style={{ margin: 0 }}>
          "Make yourself an ark of gopher wood..." — Genesis 6:14
        </p>
      </div>
    </div>
  );
}
