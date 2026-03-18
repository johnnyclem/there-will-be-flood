import { useGameStore, selectLocalPlayer, selectLocalArk } from '../store/gameStore';
import { getTerrainHeight } from '../game/Terrain';

const SPECIES = ['Lion', 'Elephant', 'Dove', 'Horse', 'Sheep', 'Wolf', 'Bear'];
const SPECIES_ICONS: Record<string, string> = {
  Lion: '\u{1F981}',
  Elephant: '\u{1F418}',
  Dove: '\u{1F54A}\uFE0F',
  Horse: '\u{1F40E}',
  Sheep: '\u{1F411}',
  Wolf: '\u{1F43A}',
  Bear: '\u{1F43B}',
};

interface BuildPhase {
  name: string;
  description: string;
  sectionStart: number;
  sectionEnd: number;
  woodCost: number;
}

/** Compute build phases scaled to the ark's totalSections */
function computeBuildPhases(totalSections: number): BuildPhase[] {
  if (totalSections <= 20) {
    // Versus mode: 20 sections
    return [
      { name: 'Foundation', description: 'Lay the keel and base deck', sectionStart: 0, sectionEnd: 5, woodCost: 50 },
      { name: 'Hull Walls', description: 'Raise the side walls', sectionStart: 5, sectionEnd: 10, woodCost: 50 },
      { name: 'Upper Deck', description: 'Build the second level', sectionStart: 10, sectionEnd: 16, woodCost: 60 },
      { name: 'Roof & Cabin', description: 'Complete the shelter', sectionStart: 16, sectionEnd: 20, woodCost: 40 },
    ];
  }
  // Solo mode: 30 sections
  return [
    { name: 'Foundation', description: 'Lay the keel and base deck', sectionStart: 0, sectionEnd: 8, woodCost: 80 },
    { name: 'Hull Walls', description: 'Raise the side walls', sectionStart: 8, sectionEnd: 15, woodCost: 70 },
    { name: 'Upper Deck', description: 'Build the second level', sectionStart: 15, sectionEnd: 24, woodCost: 90 },
    { name: 'Roof & Cabin', description: 'Complete the shelter', sectionStart: 24, sectionEnd: 30, woodCost: 60 },
  ];
}

function PhaseProgress({ phase, sectionsBuilt }: { phase: BuildPhase; sectionsBuilt: number }) {
  const phaseTotal = phase.sectionEnd - phase.sectionStart;
  const phaseBuilt = Math.max(0, Math.min(phaseTotal, sectionsBuilt - phase.sectionStart));
  const pct = (phaseBuilt / phaseTotal) * 100;
  const isComplete = phaseBuilt >= phaseTotal;
  const isActive = sectionsBuilt >= phase.sectionStart && sectionsBuilt < phase.sectionEnd;
  const isLocked = sectionsBuilt < phase.sectionStart;

  return (
    <div style={{
      padding: '10px 14px',
      background: isComplete ? 'rgba(46,204,113,0.15)' : isActive ? 'rgba(52,152,219,0.15)' : 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      border: isActive ? '1px solid rgba(52,152,219,0.5)' : '1px solid rgba(255,255,255,0.08)',
      opacity: isLocked ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: isComplete ? '#2ecc71' : isActive ? '#3498db' : '#888' }}>
          {isComplete ? '\u2713 ' : isActive ? '\u25B6 ' : '\u{1F512} '}{phase.name}
        </div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>
          {phaseBuilt}/{phaseTotal} sections
        </div>
      </div>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{phase.description}</div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: isComplete ? '#2ecc71' : '#3498db',
          borderRadius: '3px',
          transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ fontSize: '10px', color: '#777', marginTop: '4px' }}>
        Cost: {phase.woodCost} wood total ({phaseTotal} sections x 10 wood)
      </div>
    </div>
  );
}

function ArkVisual({ progress }: { progress: number }) {
  const baseColor = progress > 0 ? '#6B4226' : '#333';
  const wallColor = progress >= 0.27 ? '#6B4226' : '#333';
  const deckColor = progress >= 0.5 ? '#5C4033' : '#333';
  const roofColor = progress >= 0.8 ? '#5C3D2E' : '#333';

  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <svg width="280" height="100" viewBox="0 0 280 100">
        {/* Roof/Cabin - Phase 4 */}
        <rect x="90" y="8" width="100" height="18" rx="2"
          fill={roofColor} stroke={progress >= 0.8 ? '#8B6914' : '#444'} strokeWidth="1" />
        {/* Upper Deck - Phase 3 */}
        <rect x="60" y="26" width="160" height="8" rx="1"
          fill={deckColor} stroke={progress >= 0.5 ? '#8B6914' : '#444'} strokeWidth="1" />
        {/* Hull Walls - Phase 2 */}
        <rect x="40" y="34" width="200" height="28" rx="2"
          fill={wallColor} stroke={progress >= 0.27 ? '#8B6914' : '#444'} strokeWidth="1" />
        {/* Section lines */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={62 + i * 20} y1="34" x2={62 + i * 20} y2="62"
            stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        ))}
        {/* Foundation/Base - Phase 1 */}
        <path d="M 20 62 Q 20 82, 60 86 L 220 86 Q 260 82, 260 62 Z"
          fill={baseColor} stroke={progress > 0 ? '#8B6914' : '#444'} strokeWidth="1.5" />
        {/* Bow */}
        <path d="M 260 62 Q 278 55, 275 40 Q 272 50, 260 55"
          fill={baseColor} stroke={progress > 0 ? '#8B6914' : '#444'} strokeWidth="1" />
        {/* Water line */}
        <line x1="5" y1="88" x2="275" y2="88" stroke="#3498db" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
      </svg>
      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
        {progress === 0 && 'Blueprint - Gather resources to begin'}
        {progress > 0 && progress < 0.27 && 'Foundation in progress...'}
        {progress >= 0.27 && progress < 0.5 && 'Hull walls rising...'}
        {progress >= 0.5 && progress < 0.8 && 'Upper deck taking shape...'}
        {progress >= 0.8 && progress < 1 && 'Almost complete!'}
        {progress >= 1 && '\u2728 The Ark is complete! \u2728'}
      </div>
    </div>
  );
}

export function BuildMenu() {
  const player = useGameStore(selectLocalPlayer);
  const ark = useGameStore(selectLocalArk);
  const toggleBuildMenu = useGameStore((s) => s.toggleBuildMenu);
  const placeArk = useGameStore((s) => s.placeArk);
  const buildArkSection = useGameStore((s) => s.buildArkSection);
  const coatWithPitch = useGameStore((s) => s.coatWithPitch);
  const matchMode = useGameStore((s) => s.matchConfig.mode);
  const animalStates = useGameStore((s) => s.animalStates);

  if (!player || !ark) return null;

  const isVersus = matchMode === 'versus';
  const buildProgress = ark.sectionsBuilt / ark.totalSections;
  const canBuild = ark.position && player.inventory.wood >= 10 && ark.sectionsBuilt < ark.totalSections;
  const canPitch = ark.position && player.inventory.pitch >= 5 && ark.pitchCoated < ark.sectionsBuilt;
  const pitchPct = ark.sectionsBuilt > 0 ? (ark.pitchCoated / ark.sectionsBuilt) * 100 : 0;

  const elevation = getTerrainHeight(player.position[0], player.position[2]);
  const isHighGround = elevation > 5;
  const isLowGround = elevation < 1;

  const boardedIds = new Set(ark.boardedAnimalIds);
  const buildPhases = computeBuildPhases(ark.totalSections);

  const handlePlaceArk = () => {
    placeArk([player.position[0], player.position[1], player.position[2]]);
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  };

  // Requirements summary varies by mode
  const requirementsSummary = isVersus
    ? '200 wood (20 sections x 10) | 100 pitch (20 sections x 5) | 7 species (1 each)'
    : '300 wood (30 sections x 10) | 150 pitch (30 sections x 5) | 14 animals (7 species x 2)';

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      fontFamily: "'Segoe UI', sans-serif",
      color: 'white',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(30,30,40,0.97) 0%, rgba(20,20,30,0.97) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '24px 28px',
        maxWidth: '520px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#e8d5a3' }}>
              Build Menu
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {!ark.position ? 'Choose a location and place the Ark' : `${Math.round(buildProgress * 100)}% complete`}
            </div>
          </div>
          <button onClick={toggleBuildMenu} style={{
            ...btnBase,
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.1)',
            color: '#aaa',
            fontSize: '12px',
          }}>
            [B] Close
          </button>
        </div>

        {/* Ark Visual */}
        <ArkVisual progress={buildProgress} />

        {/* Resources Available */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '12px', color: '#e8d5a3', fontWeight: 600, width: '100%', marginBottom: '2px' }}>
            Your Resources
          </div>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: player.inventory.wood >= 10 ? '#2ecc71' : '#e74c3c' }}>
              {player.inventory.wood} wood
            </span>
          </div>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: player.inventory.pitch >= 5 ? '#2ecc71' : '#e74c3c' }}>
              {player.inventory.pitch} pitch
            </span>
          </div>
          <div style={{ fontSize: '12px' }}>
            {player.inventory.food} food
          </div>
          <div style={{ fontSize: '12px' }}>
            {player.inventory.gopherWood} gopher wood
          </div>
        </div>

        {/* Phase 0: Place Ark */}
        {!ark.position && (
          <div style={{
            padding: '14px',
            background: 'rgba(241,196,15,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(241,196,15,0.3)',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1c40f', marginBottom: '8px' }}>
              Step 1: Place the Ark
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
              Choose where to build. Your current location:
            </div>
            <div style={{
              fontSize: '12px',
              color: isHighGround ? '#e67e22' : isLowGround ? '#3498db' : '#2ecc71',
              marginBottom: '8px',
            }}>
              {isHighGround && '\u26F0\uFE0F High Ground (elev: ' + elevation.toFixed(1) + ') - Safe from early floods, harder for animals'}
              {isLowGround && '\u{1F30A} Low Ground (elev: ' + elevation.toFixed(1) + ') - Easy animal access, floods sooner!'}
              {!isHighGround && !isLowGround && '\u{1F3D4}\uFE0F Mid Elevation (elev: ' + elevation.toFixed(1) + ') - Balanced location'}
            </div>
            <button onClick={handlePlaceArk} style={{
              ...btnBase,
              background: '#f1c40f',
              color: '#1a1a1a',
              width: '100%',
            }}>
              Place Ark Here
            </button>
          </div>
        )}

        {/* Build Phases */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8d5a3', marginBottom: '10px' }}>
            Construction Phases
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {buildPhases.map((phase) => (
              <PhaseProgress key={phase.name} phase={phase} sectionsBuilt={ark.sectionsBuilt} />
            ))}
          </div>
        </div>

        {/* Build Actions */}
        {ark.position && (
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => { if (canBuild) buildArkSection(); }}
              disabled={!canBuild}
              style={{
                ...btnBase,
                flex: 1,
                background: canBuild ? '#2ecc71' : 'rgba(255,255,255,0.08)',
                color: canBuild ? '#1a1a1a' : '#555',
                cursor: canBuild ? 'pointer' : 'not-allowed',
              }}
            >
              Build Section
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px' }}>
                {ark.sectionsBuilt >= ark.totalSections ? 'Complete!' : `Costs 10 wood (have ${player.inventory.wood})`}
              </div>
            </button>
            <button
              onClick={() => { if (canPitch) coatWithPitch(); }}
              disabled={!canPitch}
              style={{
                ...btnBase,
                flex: 1,
                background: canPitch ? '#1a1a2a' : 'rgba(255,255,255,0.08)',
                color: canPitch ? '#ccc' : '#555',
                border: canPitch ? '1px solid #555' : 'none',
                cursor: canPitch ? 'pointer' : 'not-allowed',
              }}
            >
              Apply Pitch
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px' }}>
                {ark.sectionsBuilt === 0
                  ? 'Build sections first'
                  : `Costs 5 pitch (have ${player.inventory.pitch})`}
              </div>
            </button>
          </div>
        )}

        {/* Waterproofing Progress */}
        {ark.position && ark.sectionsBuilt > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#aaa' }}>Waterproofing (Pitch)</span>
              <span style={{ color: '#aaa' }}>{ark.pitchCoated}/{ark.sectionsBuilt} sections coated</span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${pitchPct}%`,
                height: '100%',
                background: '#1a1a1a',
                borderRadius: '3px',
                transition: 'width 0.3s',
                boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2)',
              }} />
            </div>
          </div>
        )}

        {/* Animal Boarding */}
        <div style={{
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#e8d5a3', fontWeight: 600 }}>Animal Boarding</span>
            <span style={{ color: '#aaa' }}>{ark.animalsBoarded}/{ark.totalAnimals}</span>
          </div>

          {isVersus ? (
            // Versus mode: 1 of each species required
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
              {SPECIES.map((species) => {
                const hasSpecies = animalStates.some(
                  (a) => a.species === species && a.boardedByPlayerId === ark.boardedAnimalIds.find((id) => {
                    const found = animalStates.find((x) => x.id === id);
                    return found?.species === species;
                  }) as unknown as string
                );
                // Simpler check: any animal of this species boarded by local player
                const boardedSpecies = boardedIds.size > 0
                  ? animalStates.filter((a) => boardedIds.has(a.id)).map((a) => a.species)
                  : [];
                const hasOne = boardedSpecies.includes(species);

                return (
                  <div key={species} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: hasOne ? 'rgba(46,204,113,0.15)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    <span>{SPECIES_ICONS[species]}</span>
                    <span style={{ color: hasOne ? '#2ecc71' : '#aaa' }}>{species}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#777' }}>
                      {hasOne ? '\u2713' : '\u2717'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // Solo mode: pairs required — animals are created 2 per species, ids: si*2 and si*2+1
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
              {SPECIES.map((species, si) => {
                const id1 = si * 2;
                const id2 = si * 2 + 1;
                const has1 = boardedIds.has(id1);
                const has2 = boardedIds.has(id2);
                const pairComplete = has1 && has2;

                return (
                  <div key={species} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    background: pairComplete ? 'rgba(46,204,113,0.15)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    <span>{SPECIES_ICONS[species]}</span>
                    <span style={{ color: pairComplete ? '#2ecc71' : '#aaa' }}>{species}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#777' }}>
                      {has1 ? '\u2713' : '\u2717'}{has2 ? '\u2713' : '\u2717'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>
            {isVersus
              ? 'Herd animals near you then board 1 of each species [F] near the ark'
              : 'Find animals nearby and press [F] near the ark to board them'}
          </div>
        </div>

        {/* Total Requirements Summary */}
        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#666',
        }}>
          <div style={{ fontWeight: 600, color: '#888', marginBottom: '4px' }}>Total Requirements</div>
          <div>{requirementsSummary}</div>
        </div>
      </div>
    </div>
  );
}
