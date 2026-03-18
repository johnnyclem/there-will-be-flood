import { useGameStore, type AIDifficulty } from '../store/gameStore';

const DIFFICULTY_INFO: Array<{ key: AIDifficulty; label: string; description: string }> = [
  { key: 'apprentice', label: 'Apprentice', description: 'Novice builder' },
  { key: 'prophet', label: 'Prophet', description: 'Worthy opponent' },
  { key: 'patriarch', label: 'Patriarch', description: 'Master strategist' },
];

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
        alignItems: 'center',
        gap: '16px',
        zIndex: 1,
      }}>
        {/* Solo journey button */}
        <button
          onClick={() => startGame({ mode: 'solo', aiDifficulty: 'prophet' })}
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

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '8px',
          marginBottom: '4px',
          width: '100%',
          maxWidth: '440px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(218,165,32,0.3))' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(218,165,32,0.3))' }} />
        </div>

        {/* Versus AI section */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '13px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '14px',
          }}>
            Challenge a Rival
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {DIFFICULTY_INFO.map(({ key, label, description }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => startGame({ mode: 'versus', aiDifficulty: key })}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #5a3a10 0%, #8B5E14 100%)',
                    color: '#e8d5a3',
                    border: '1px solid rgba(218,165,32,0.35)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: "'Georgia', serif",
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    transition: 'all 0.25s',
                    minWidth: '120px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.06)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(180,120,30,0.45)';
                    e.currentTarget.style.borderColor = 'rgba(218,165,32,0.7)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7a5218 0%, #B8860B 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(218,165,32,0.35)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #5a3a10 0%, #8B5E14 100%)';
                  }}
                >
                  {label}
                </button>
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '1px',
                }}>
                  {description}
                </span>
              </div>
            ))}
          </div>
        </div>
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
