import { useGameStore, selectRivalIds, type ArkState } from '../store/gameStore';

function getStatusLabel(playerId: string, arks: Record<string, ArkState>, winnerId: string | null, gameState: string): string {
  if (winnerId === playerId) return 'Victorious';
  if (gameState === 'gameover' || gameState === 'victory') return 'Eliminated';
  const ark = arks[playerId];
  if (!ark) return 'Active';
  return 'Active';
}

function getStatusColor(playerId: string, winnerId: string | null, gameState: string): string {
  if (winnerId === playerId) return '#DAA520';
  if (gameState === 'gameover' || gameState === 'victory') return '#e74c3c';
  return '#2ecc71';
}

export function Scoreboard() {
  const players = useGameStore((s) => s.players);
  const arks = useGameStore((s) => s.arks);
  const scores = useGameStore((s) => s.scores);
  const matchConfig = useGameStore((s) => s.matchConfig);
  const toggleScoreboard = useGameStore((s) => s.toggleScoreboard);
  const winnerId = useGameStore((s) => s.winnerId);
  const gameState = useGameStore((s) => s.gameState);
  const localPlayerId = useGameStore((s) => s.localPlayerId);

  const allPlayerIds = Object.keys(players);
  // Sort: local player first, then rivals; then by score desc
  const sortedIds = [...allPlayerIds].sort((a, b) => {
    if (a === localPlayerId) return -1;
    if (b === localPlayerId) return 1;
    return (scores[b] ?? 0) - (scores[a] ?? 0);
  });

  const modeLabel = matchConfig.mode === 'versus' ? 'Versus AI' : 'Solo Journey';

  return (
    <div
      role="dialog"
      aria-label="Scoreboard"
      aria-modal="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        fontFamily: "'Georgia', serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleScoreboard();
      }}
    >
      <div style={{
        background: 'rgba(8,14,28,0.97)',
        border: '1px solid rgba(218,165,32,0.4)',
        borderRadius: '12px',
        padding: '32px 40px',
        minWidth: '520px',
        maxWidth: '680px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            margin: '0 0 4px',
            fontSize: '28px',
            letterSpacing: '6px',
            color: '#e8d5a3',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(218,165,32,0.3)',
          }}>
            Scoreboard
          </h2>
          <div style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            {modeLabel}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(218,165,32,0.4), transparent)',
          marginBottom: '20px',
        }} />

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 100px 80px 90px',
          gap: '8px',
          padding: '0 8px 10px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '8px',
        }}>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>Ark %</span>
          <span style={{ textAlign: 'center' }}>Species</span>
          <span style={{ textAlign: 'right' }}>Score</span>
          <span style={{ textAlign: 'center' }}>Status</span>
        </div>

        {/* Rows */}
        {sortedIds.map((playerId) => {
          const player = players[playerId];
          const ark = arks[playerId];
          const score = scores[playerId] ?? 0;
          if (!player || !ark) return null;

          const arkPct = Math.round((ark.sectionsBuilt / ark.totalSections) * 100);
          const isLocal = playerId === localPlayerId;
          const status = getStatusLabel(playerId, arks, winnerId, gameState);
          const statusColor = getStatusColor(playerId, winnerId, gameState);

          // Count unique species boarded
          const boardedSpecies = new Set(
            ark.boardedAnimalIds
          ).size;

          return (
            <div
              key={playerId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 100px 80px 90px',
                gap: '8px',
                padding: '12px 8px',
                borderRadius: '6px',
                background: isLocal ? 'rgba(218,165,32,0.08)' : 'transparent',
                border: isLocal ? '1px solid rgba(218,165,32,0.2)' : '1px solid transparent',
                marginBottom: '4px',
                alignItems: 'center',
                color: 'white',
                fontSize: '14px',
              }}
            >
              {/* Name + color indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: player.color,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${player.color}`,
                }} />
                <span style={{
                  fontFamily: "'Georgia', serif",
                  color: isLocal ? '#e8d5a3' : 'white',
                  fontWeight: isLocal ? 'bold' : 'normal',
                }}>
                  {player.name}
                  {isLocal && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>
                      (you)
                    </span>
                  )}
                </span>
              </div>

              {/* Ark % */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '13px',
                  color: arkPct === 100 ? '#2ecc71' : '#e8d5a3',
                  marginBottom: '3px',
                }}>
                  {arkPct}%
                </div>
                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${arkPct}%`,
                    background: arkPct === 100 ? '#2ecc71' : 'linear-gradient(to right, #8B6914, #DAA520)',
                    borderRadius: '2px',
                  }} />
                </div>
              </div>

              {/* Species boarded */}
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: boardedSpecies > 0 ? '#87CEEB' : 'rgba(255,255,255,0.4)',
              }}>
                {boardedSpecies} / {ark.totalAnimals}
              </div>

              {/* Score */}
              <div style={{
                textAlign: 'right',
                color: '#f1c40f',
                fontWeight: 'bold',
                fontSize: '14px',
              }}>
                {score.toLocaleString()}
              </div>

              {/* Status */}
              <div style={{
                textAlign: 'center',
                fontSize: '11px',
                color: statusColor,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                {status}
              </div>
            </div>
          );
        })}

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(218,165,32,0.4), transparent)',
          margin: '20px 0 16px',
        }} />

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Press Tab to close
        </div>
      </div>
    </div>
  );
}
