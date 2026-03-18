import { useGameStore, selectLocalPlayer, selectLocalArk, selectLocalScore } from '../store/gameStore';

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

export function HUD() {
  const player = useGameStore(selectLocalPlayer);
  const ark = useGameStore(selectLocalArk);
  const world = useGameStore((s) => s.world);
  const score = useGameStore(selectLocalScore);
  const matchMode = useGameStore((s) => s.matchConfig.mode);

  if (!player || !ark) return null;

  const isVersus = matchMode === 'versus';
  const faithReady = isVersus && player.faith >= 100;

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
        {faithReady && (
          <div style={{
            marginTop: '6px',
            padding: '4px 8px',
            background: 'rgba(155,89,182,0.3)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#d7a8f0',
            border: '1px solid rgba(155,89,182,0.5)',
            textAlign: 'center',
          }}>
            Divine Power Ready! [Use Build Menu]
          </div>
        )}
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
          <div>Wood: {player.inventory.wood}</div>
          <div>Pitch: {player.inventory.pitch}</div>
          <div>Food: {player.inventory.food}</div>
          <div>Gopher Wood: {player.inventory.gopherWood}</div>
          <div>Artifacts: {player.inventory.holyArtifacts}</div>
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
          <div style={{ fontSize: '12px', color: '#ffdd00' }}>
            Press [B] to open Build Menu
          </div>
        ) : (
          <>
            <ProgressBar
              value={ark.sectionsBuilt}
              max={ark.totalSections}
              color="#2ecc71"
              label="Construction"
            />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Animals: {ark.animalsBoarded}/{ark.totalAnimals}
            </div>
            <div style={{ fontSize: '11px', color: '#ffdd00', marginTop: '4px' }}>
              [B] Build Menu
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
          {world.tideWarning ? 'RISING TIDE' : 'Tide Level'}
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
        WASD: Move | Shift: Sprint | Scroll: Zoom | RMB: Rotate | B: Build Menu | ESC: Pause
        {isVersus && ' | Tab: Scoreboard'}
      </div>
    </div>
  );
}
