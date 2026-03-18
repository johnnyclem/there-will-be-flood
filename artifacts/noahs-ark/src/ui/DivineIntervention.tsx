import { useEffect } from 'react';
import { useGameStore, selectRivalIds, type DivinePower } from '../store/gameStore';

interface PowerCardProps {
  icon: string;
  name: string;
  description: string;
  power: DivinePower;
  onSelect: (power: DivinePower) => void;
}

function PowerCard({ icon, name, description, power, onSelect }: PowerCardProps) {
  return (
    <button
      onClick={() => onSelect(power)}
      aria-label={`Choose ${name}: ${description}`}
      style={{
        flex: 1,
        padding: '24px 16px',
        background: 'rgba(218,165,32,0.06)',
        border: '1px solid rgba(218,165,32,0.3)',
        borderRadius: '10px',
        color: 'white',
        cursor: 'pointer',
        fontFamily: "'Georgia', serif",
        textAlign: 'center',
        transition: 'all 0.25s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(218,165,32,0.16)';
        e.currentTarget.style.borderColor = 'rgba(218,165,32,0.8)';
        e.currentTarget.style.boxShadow = '0 0 24px rgba(218,165,32,0.3), inset 0 0 20px rgba(218,165,32,0.05)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(218,165,32,0.06)';
        e.currentTarget.style.borderColor = 'rgba(218,165,32,0.3)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <div style={{
        fontSize: '36px',
        lineHeight: 1,
        filter: 'drop-shadow(0 0 8px rgba(218,165,32,0.6))',
      }}>
        {icon}
      </div>

      {/* Power name */}
      <div style={{
        fontSize: '15px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#e8d5a3',
      }}>
        {name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.5',
        maxWidth: '160px',
      }}>
        {description}
      </div>
    </button>
  );
}

export function DivineIntervention() {
  const setShowDivineIntervention = useGameStore((s) => s.setShowDivineIntervention);
  const useDivineIntervention = useGameStore((s) => s.useDivineIntervention);
  const players = useGameStore((s) => s.players);
  const localPlayerId = useGameStore((s) => s.localPlayerId);

  // Find first rival player ID for plague targeting
  const rivalIds = Object.keys(players).filter((id) => id !== localPlayerId);
  const firstRivalId = rivalIds[0];

  // Escape key closes without choosing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowDivineIntervention(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowDivineIntervention]);

  function handleSelect(power: DivinePower) {
    const targetId = power === 'plague_of_locusts' ? firstRivalId : undefined;
    useDivineIntervention(power, targetId);
  }

  return (
    <div
      role="dialog"
      aria-label="Divine Intervention"
      aria-modal="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        fontFamily: "'Georgia', serif",
      }}
    >
      <style>{`
        @keyframes divineGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(218,165,32,0.3), 0 0 60px rgba(218,165,32,0.1); }
          50% { box-shadow: 0 0 50px rgba(218,165,32,0.5), 0 0 100px rgba(218,165,32,0.2); }
        }
        @keyframes divinePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes divineRays {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(218,165,32,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'linear-gradient(180deg, rgba(10,8,2,0.98) 0%, rgba(8,14,20,0.98) 100%)',
        border: '2px solid rgba(218,165,32,0.6)',
        borderRadius: '16px',
        padding: '40px 48px',
        maxWidth: '640px',
        width: '90%',
        animation: 'divineGlow 3s ease-in-out infinite',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle rotating rays behind the card content */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(218,165,32,0.04) 30deg, transparent 60deg, rgba(218,165,32,0.04) 90deg, transparent 120deg, rgba(218,165,32,0.04) 150deg, transparent 180deg, rgba(218,165,32,0.04) 210deg, transparent 240deg, rgba(218,165,32,0.04) 270deg, transparent 300deg, rgba(218,165,32,0.04) 330deg, transparent 360deg)',
          animation: 'divineRays 20s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '8px',
            animation: 'divinePulse 2s ease-in-out infinite',
          }}>
            ✨
          </div>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            letterSpacing: '5px',
            color: '#e8d5a3',
            textTransform: 'uppercase',
            textShadow: '0 0 30px rgba(218,165,32,0.5), 0 0 60px rgba(218,165,32,0.2)',
          }}>
            Divine Intervention
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.6',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Your faith has reached its peak. Choose your blessing:
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(218,165,32,0.5), transparent)',
          marginBottom: '24px',
        }} />

        {/* Power cards */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <PowerCard
            icon="👁"
            name="Revelation"
            description="Reveal all resource nodes and animal positions for 30 seconds"
            power="revelation"
            onSelect={handleSelect}
          />
          <PowerCard
            icon="⚡"
            name="Blessing of Speed"
            description="Double your movement speed for 20 seconds"
            power="speed_blessing"
            onSelect={handleSelect}
          />
          <PowerCard
            icon="🦗"
            name="Plague of Locusts"
            description="Destroy half of your opponent's food supply"
            power="plague_of_locusts"
            onSelect={handleSelect}
          />
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(218,165,32,0.3), transparent)',
          marginBottom: '16px',
        }} />

        {/* Footer note */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Press Esc to defer your blessing
        </div>
      </div>
    </div>
  );
}
