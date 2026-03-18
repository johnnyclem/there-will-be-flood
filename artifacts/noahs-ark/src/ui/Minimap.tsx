import { useGameStore, selectLocalPlayer, hasActiveEffect, type DivinePower } from '../store/gameStore';

const MINIMAP_SIZE = 160;
const WORLD_SIZE = 200; // world is -100 to 100

function worldToMap(worldCoord: number): number {
  return ((worldCoord + 100) / WORLD_SIZE) * MINIMAP_SIZE;
}

const RESOURCE_COLORS: Record<string, string> = {
  wood: '#8B4513',
  pitch: '#222222',
  food: '#DAA520',
  gopherWood: '#FF8C00',
};

export function Minimap() {
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const players = useGameStore((s) => s.players);
  const arks = useGameStore((s) => s.arks);
  const resourceNodes = useGameStore((s) => s.resourceNodes);
  const animalStates = useGameStore((s) => s.animalStates);
  const discoveredArkIds = useGameStore((s) => s.discoveredArkIds);

  const localPlayer = players[localPlayerId];
  if (!localPlayer) return null;

  const localPos = localPlayer.position;

  // Check if revelation is active — lifts fog of war
  const hasRevelation = hasActiveEffect(localPlayer, 'revelation' as DivinePower);
  const FOG_RADIUS = 30;

  function isVisible(pos: [number, number, number]): boolean {
    if (hasRevelation) return true;
    const dx = pos[0] - localPos[0];
    const dz = pos[2] - localPos[2];
    return Math.sqrt(dx * dx + dz * dz) <= FOG_RADIUS;
  }

  const rivalIds = Object.keys(players).filter((id) => id !== localPlayerId);

  return (
    <div
      aria-label="Minimap"
      role="img"
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${MINIMAP_SIZE}px`,
        height: `${MINIMAP_SIZE}px`,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 40% 35%, #2d4a1e 0%, #1a3a0a 40%, #0d1f05 70%, #080f02 100%)',
        border: '2px solid rgba(218,165,32,0.5)',
        boxShadow: '0 0 12px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        pointerEvents: 'none',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Subtle terrain texture overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 60% 40%, rgba(100,80,40,0.2) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(40,80,20,0.3) 0%, transparent 40%)',
        borderRadius: '50%',
      }} />

      {/* Fog of war vignette when revelation is inactive */}
      {!hasRevelation && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${worldToMap(localPos[0])}px ${worldToMap(localPos[2])}px, transparent ${(FOG_RADIUS / WORLD_SIZE) * MINIMAP_SIZE * 0.8}px, rgba(0,0,0,0.7) ${(FOG_RADIUS / WORLD_SIZE) * MINIMAP_SIZE * 1.4}px)`,
          borderRadius: '50%',
          zIndex: 10,
          pointerEvents: 'none',
        }} />
      )}

      {/* Resource nodes */}
      {resourceNodes
        .filter((n) => n.amount > 0 && isVisible(n.position))
        .map((node) => {
          const x = worldToMap(node.position[0]);
          const y = worldToMap(node.position[2]);
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${x - 2}px`,
                top: `${y - 2}px`,
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: RESOURCE_COLORS[node.type] || '#888',
                opacity: 0.9,
                zIndex: 2,
              }}
            />
          );
        })}

      {/* Animals */}
      {animalStates
        .filter((a) => !a.boardedByPlayerId && isVisible(a.position))
        .map((animal) => {
          const x = worldToMap(animal.position[0]);
          const y = worldToMap(animal.position[2]);
          return (
            <div
              key={animal.id}
              style={{
                position: 'absolute',
                left: `${x - 1.5}px`,
                top: `${y - 1.5}px`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.8)',
                zIndex: 3,
              }}
            />
          );
        })}

      {/* Rival arks (discovered only) */}
      {rivalIds.map((rivalId) => {
        const rivalArk = arks[rivalId];
        const rivalPlayer = players[rivalId];
        if (!rivalArk || !rivalArk.position || !rivalPlayer) return null;
        const isDiscovered = discoveredArkIds.includes(rivalId);
        if (!isDiscovered && !hasRevelation) return null;
        const x = worldToMap(rivalArk.position[0]);
        const y = worldToMap(rivalArk.position[2]);
        return (
          <div
            key={`ark-${rivalId}`}
            style={{
              position: 'absolute',
              left: `${x - 4}px`,
              top: `${y - 4}px`,
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: rivalPlayer.color,
              opacity: 0.9,
              border: '1px solid rgba(255,255,255,0.4)',
              zIndex: 5,
            }}
          />
        );
      })}

      {/* Local player's ark */}
      {(() => {
        const localArk = arks[localPlayerId];
        if (!localArk || !localArk.position) return null;
        const x = worldToMap(localArk.position[0]);
        const y = worldToMap(localArk.position[2]);
        return (
          <div
            style={{
              position: 'absolute',
              left: `${x - 5}px`,
              top: `${y - 5}px`,
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: localPlayer.color,
              border: '2px solid rgba(255,255,255,0.8)',
              zIndex: 6,
            }}
          />
        );
      })()}

      {/* Rival player dots */}
      {rivalIds.map((rivalId) => {
        const rivalPlayer = players[rivalId];
        if (!rivalPlayer) return null;
        if (!isVisible(rivalPlayer.position)) return null;
        const x = worldToMap(rivalPlayer.position[0]);
        const y = worldToMap(rivalPlayer.position[2]);
        return (
          <div
            key={`player-${rivalId}`}
            style={{
              position: 'absolute',
              left: `${x - 4}px`,
              top: `${y - 4}px`,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: rivalPlayer.color,
              border: '1px solid rgba(255,255,255,0.6)',
              zIndex: 7,
            }}
          />
        );
      })}

      {/* Local player dot — always visible, on top */}
      {(() => {
        const x = worldToMap(localPos[0]);
        const y = worldToMap(localPos[2]);
        return (
          <div
            style={{
              position: 'absolute',
              left: `${x - 6}px`,
              top: `${y - 6}px`,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: localPlayer.color,
              border: '2px solid white',
              boxShadow: `0 0 6px ${localPlayer.color}`,
              zIndex: 8,
            }}
          />
        );
      })()}

      {/* Revelation glow overlay */}
      {hasRevelation && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(218,165,32,0.8)',
          boxShadow: 'inset 0 0 20px rgba(218,165,32,0.2)',
          pointerEvents: 'none',
          zIndex: 9,
        }} />
      )}

      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '8px',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '1px',
        zIndex: 11,
        fontFamily: "'Segoe UI', sans-serif",
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        {hasRevelation ? 'REVEALED' : 'MAP'}
      </div>
    </div>
  );
}
