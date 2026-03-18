import { useGameStore } from '../store/gameStore';
import { getTerrainHeight } from '../game/Terrain';

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
        <span>{label}</span>
        <span>{Math.round(value)}/{max}</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}

function ArkPlacementHint({ playerPosition }: { playerPosition: [number, number, number] }) {
  const elevation = getTerrainHeight(playerPosition[0], playerPosition[2]);
  const isHighGround = elevation > 5;
  const isLowGround = elevation < 1;
  const isMidGround = !isHighGround && !isLowGround;

  let terrainLabel: string;
  let terrainColor: string;
  let pros: string;
  let cons: string;

  if (isHighGround) {
    terrainLabel = 'High Ground';
    terrainColor = '#e67e22';
    pros = 'Safe from early floods';
    cons = 'Harder for animals to reach';
  } else if (isLowGround) {
    terrainLabel = 'Low Ground';
    terrainColor = '#3498db';
    pros = 'Easy animal access';
    cons = 'Floods sooner — build fast!';
  } else {
    terrainLabel = 'Mid Elevation';
    terrainColor = '#2ecc71';
    pros = 'Balanced location';
    cons = 'No major advantages';
  }

  return (
    <div>
      <div style={{
        fontSize: '12px',
        color: '#ffdd00',
        marginBottom: '6px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        Press [B] to place the Ark here
      </div>
      <div style={{ fontSize: '11px', color: terrainColor, marginBottom: '4px' }}>
        Terrain: {terrainLabel} (elev: {elevation.toFixed(1)})
      </div>
      <div style={{ fontSize: '10px', color: '#8f8' }}>
        + {pros}
      </div>
      <div style={{ fontSize: '10px', color: '#f88' }}>
        - {cons}
      </div>
    </div>
  );
}

export function HUD() {
  const player = useGameStore((s) => s.player);
  const ark = useGameStore((s) => s.ark);
  const world = useGameStore((s) => s.world);
  const score = useGameStore((s) => s.score);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', sans-serif",
      color: 'white',
    }}>
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '180px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <ProgressBar value={player.health} max={player.maxHealth} color="#e74c3c" label="Health" />
        <ProgressBar value={player.stamina} max={player.maxStamina} color="#f39c12" label="Stamina" />
        <ProgressBar value={player.faith} max={player.maxFaith} color="#9b59b6" label="Faith" />
      </div>

      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '160px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#e8d5a3' }}>
          Inventory
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
          <div>🪵 Wood: {player.inventory.wood}</div>
          <div>🛢️ Pitch: {player.inventory.pitch}</div>
          <div>🍞 Food: {player.inventory.food}</div>
          <div>🌳 Gopher Wood: {player.inventory.gopherWood}</div>
          <div>✨ Artifacts: {player.inventory.holyArtifacts}</div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
          Tool: {player.tool.toUpperCase()} [1/2/3]
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '200px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#87CEEB' }}>
          The Ark
        </div>
        {!ark.position ? (
          <ArkPlacementHint playerPosition={player.position} />
        ) : (
          <>
            <ProgressBar
              value={ark.sectionsBuilt}
              max={ark.totalSections}
              color="#2ecc71"
              label="Construction"
            />
            <ProgressBar
              value={ark.pitchCoated}
              max={ark.sectionsBuilt || 1}
              color="#1a1a1a"
              label="Pitch Coated"
            />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Animals: {ark.animalsBoarded}/{ark.totalAnimals}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
              [B] Build (10 wood) | [P] Pitch (5)
            </div>
          </>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '160px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: world.tideWarning ? '#e74c3c' : '#87CEEB' }}>
          {world.tideWarning ? '⚠️ RISING TIDE' : '🌊 Tide Level'}
        </div>
        <div style={{
          width: '100%',
          height: '40px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: `${Math.min(100, Math.max(0, ((world.waterLevel + 2) / 15) * 100))}%`,
            background: 'linear-gradient(to top, #1a3a6a, #3498db)',
            transition: 'height 0.5s',
          }} />
        </div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>
          Day {world.dayNumber}
        </div>
        <div style={{ fontSize: '12px' }}>
          Storm: {Math.round(world.stormIntensity * 100)}%
        </div>
        <div style={{ fontSize: '12px', color: '#f1c40f' }}>
          Score: {score}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)',
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#aaa',
      }}>
        WASD: Move | Shift: Sprint | Scroll: Zoom | RMB: Rotate | B: {ark.position ? 'Build' : 'Place Ark'} | ESC: Pause
      </div>
    </div>
  );
}
