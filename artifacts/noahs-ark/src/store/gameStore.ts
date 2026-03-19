import { create } from 'zustand';
import {
  generateResourceNodes,
  generateAnimalStates,
  getSpawnPosition,
  PLAYER_COLORS,
  PLAYER_NAMES,
  AI_PROFILES,
} from './worldGen';
import { SFX } from '../utils/sfx';

// --- Types ---

export type GameState = 'menu' | 'lobby' | 'playing' | 'paused' | 'gameover' | 'victory';
export type MatchMode = 'solo' | 'versus';
export type AIDifficulty = 'apprentice' | 'prophet' | 'patriarch';
export type DivinePower = 'revelation' | 'speed_blessing' | 'plague_of_locusts';

export interface MatchConfig {
  mode: MatchMode;
  aiDifficulty: AIDifficulty;
}

export interface Inventory {
  wood: number;
  pitch: number;
  food: number;
  gopherWood: number;
  holyArtifacts: number;
}

export interface ActiveEffect {
  type: DivinePower;
  expiresAt: number;
  targetPlayerId?: string;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  faith: number;
  maxFaith: number;
  position: [number, number, number];
  inventory: Inventory;
  tool: 'axe' | 'hammer' | 'staff';
  color: string;
  name: string;
  isAI: boolean;
  activeEffects: ActiveEffect[];
}

export interface ArkState {
  sectionsBuilt: number;
  totalSections: number;
  pitchCoated: number;
  animalsBoarded: number;
  totalAnimals: number;
  boardedAnimalIds: number[];
  buoyancy: number;
  integrity: number;
  position: [number, number, number] | null;
}

export interface WorldState {
  waterLevel: number;
  waterRiseRate: number;
  stormIntensity: number;
  dayNumber: number;
  timeOfDay: number;
  tideWarning: boolean;
}

export interface ResourceNode {
  id: number;
  position: [number, number, number];
  type: 'wood' | 'pitch' | 'food' | 'gopherWood';
  amount: number;
  maxAmount: number;
  lockedBy: string | null;
  lockedUntil: number;
}

export interface AnimalState {
  id: number;
  species: string;
  color: string;
  size: [number, number, number];
  position: [number, number, number];
  startPosition: [number, number, number];
  wanderRadius: number;
  speed: number;
  paired: boolean;
  followingPlayerId: string | null;
  boardedByPlayerId: string | null;
}

// --- Constants ---

const LOCAL_PLAYER_ID = 'player-0';
const AI_PLAYER_ID = 'player-1';

const SOLO_SECTIONS = 30;
const VERSUS_SECTIONS = 20;
const SOLO_ANIMALS = 14;
const VERSUS_ANIMALS = 7; // 1 of each species

// --- Helpers ---

function makePlayer(
  index: number,
  position: [number, number, number],
  isAI: boolean,
  overrideName?: string,
  overrideColor?: string,
): PlayerState {
  return {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    faith: 50,
    maxFaith: 100,
    position,
    inventory: { wood: 0, pitch: 0, food: 10, gopherWood: 0, holyArtifacts: 0 },
    tool: 'axe',
    color: overrideColor ?? (PLAYER_COLORS[index] || '#888888'),
    name: overrideName ?? (isAI ? 'Rival Patriarch' : (PLAYER_NAMES[index] || 'Player')),
    isAI,
    activeEffects: [],
  };
}

function makeArk(mode: MatchMode): ArkState {
  const sections = mode === 'versus' ? VERSUS_SECTIONS : SOLO_SECTIONS;
  const animals = mode === 'versus' ? VERSUS_ANIMALS : SOLO_ANIMALS;
  return {
    sectionsBuilt: 0,
    totalSections: sections,
    pitchCoated: 0,
    animalsBoarded: 0,
    totalAnimals: animals,
    boardedAnimalIds: [],
    buoyancy: 0,
    integrity: 100,
    position: null,
  };
}

// --- Default config ---

const defaultConfig: MatchConfig = { mode: 'solo', aiDifficulty: 'prophet' };

// --- Store interface ---

interface GameStore {
  // Match
  gameState: GameState;
  matchConfig: MatchConfig;
  localPlayerId: string;

  // Players (indexed by ID)
  players: Record<string, PlayerState>;
  arks: Record<string, ArkState>;
  scores: Record<string, number>;

  // Shared world
  world: WorldState;
  resourceNodes: ResourceNode[];
  animalStates: AnimalState[];

  // Fog of war
  discoveredArkIds: string[];

  // UI state
  resetCounter: number;
  buildMenuOpen: boolean;
  cameraRotation: number;
  cameraShake: number;
  showDivineIntervention: boolean;
  scoreboardOpen: boolean;
  winnerId: string | null;

  // --- Actions ---

  setGameState: (state: GameState) => void;
  startGame: (config?: MatchConfig) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: (victory: boolean, winnerId?: string) => void;
  toggleBuildMenu: () => void;

  // World
  updateWaterLevel: (delta: number) => void;
  updateStormIntensity: (intensity: number) => void;
  incrementDay: () => void;

  // Player actions (playerId defaults to localPlayerId)
  addResource: (resource: keyof Inventory, amount: number, playerId?: string) => void;
  removeResource: (resource: keyof Inventory, amount: number, playerId?: string) => boolean;
  updateHealth: (amount: number, playerId?: string) => void;
  updateStamina: (amount: number, playerId?: string) => void;
  updateFaith: (amount: number, playerId?: string) => void;
  setPlayerPosition: (pos: [number, number, number], playerId?: string) => void;
  switchTool: (tool: 'axe' | 'hammer' | 'staff', playerId?: string) => void;

  // Ark actions
  placeArk: (pos: [number, number, number], playerId?: string) => void;
  buildArkSection: (playerId?: string) => void;
  coatWithPitch: (playerId?: string) => void;
  boardAnimal: (animalId: number, playerId?: string) => void;

  // Resource nodes
  gatherResource: (nodeId: number, playerId?: string) => boolean;
  clearStaleLocks: () => void;

  // Animals
  updateAnimalPosition: (animalId: number, pos: [number, number, number]) => void;
  setAnimalFollowing: (animalId: number, playerId: string | null) => void;

  // Divine Intervention
  useDivineIntervention: (power: DivinePower, targetId?: string, playerId?: string) => void;
  clearExpiredEffects: () => void;
  setShowDivineIntervention: (show: boolean) => void;

  // Fog of war
  discoverArk: (arkPlayerId: string) => void;

  // Camera
  setCameraRotation: (r: number) => void;
  triggerCameraShake: (intensity: number) => void;

  // Scoreboard
  toggleScoreboard: () => void;
}

// --- Helpers for updating nested player/ark state ---

function updatePlayer(
  state: { players: Record<string, PlayerState> },
  playerId: string,
  updater: (p: PlayerState) => Partial<PlayerState>,
): Record<string, PlayerState> {
  const player = state.players[playerId];
  if (!player) return state.players;
  return { ...state.players, [playerId]: { ...player, ...updater(player) } };
}

function updateArk(
  state: { arks: Record<string, ArkState> },
  playerId: string,
  updater: (a: ArkState) => Partial<ArkState>,
): Record<string, ArkState> {
  const ark = state.arks[playerId];
  if (!ark) return state.arks;
  return { ...state.arks, [playerId]: { ...ark, ...updater(ark) } };
}

// --- Create store ---

export const useGameStore = create<GameStore>((set, get) => ({
  // --- Initial state ---
  gameState: 'menu',
  matchConfig: defaultConfig,
  localPlayerId: LOCAL_PLAYER_ID,

  players: {},
  arks: {},
  scores: {},

  world: {
    waterLevel: -2,
    waterRiseRate: 0.002,
    stormIntensity: 0,
    dayNumber: 1,
    timeOfDay: 0.5,
    tideWarning: false,
  },
  resourceNodes: [],
  animalStates: [],

  discoveredArkIds: [],

  resetCounter: 0,
  buildMenuOpen: false,
  cameraRotation: 0,
  cameraShake: 0,
  showDivineIntervention: false,
  scoreboardOpen: false,
  winnerId: null,

  // --- Game flow ---

  setGameState: (state) => set({ gameState: state }),

  startGame: (config?: MatchConfig) => {
    const cfg = config || defaultConfig;
    const isVersus = cfg.mode === 'versus';
    const totalPlayers = isVersus ? 2 : 1;

    // Create players
    const players: Record<string, PlayerState> = {};
    const arks: Record<string, ArkState> = {};
    const scores: Record<string, number> = {};

    for (let i = 0; i < totalPlayers; i++) {
      const id = `player-${i}`;
      const isAI = i > 0;
      const pos = isVersus ? getSpawnPosition(i, totalPlayers) : [0, 2, 0] as [number, number, number];
      const aiProfile = isAI ? AI_PROFILES[cfg.aiDifficulty] : undefined;
      players[id] = makePlayer(i, pos, isAI, aiProfile?.name, aiProfile?.color);
      arks[id] = makeArk(cfg.mode);
      scores[id] = 0;
    }

    // Generate world
    const resourceNodes = generateResourceNodes(cfg);
    const animalStates = generateAnimalStates(cfg);

    set((state) => ({
      gameState: 'playing',
      matchConfig: cfg,
      localPlayerId: LOCAL_PLAYER_ID,
      players,
      arks,
      scores,
      world: {
        waterLevel: -2,
        waterRiseRate: 0.002,
        stormIntensity: 0,
        dayNumber: 1,
        timeOfDay: 0.5,
        tideWarning: false,
      },
      resourceNodes,
      animalStates,
      discoveredArkIds: [],
      resetCounter: state.resetCounter + 1,
      buildMenuOpen: false,
      showDivineIntervention: false,
      scoreboardOpen: false,
      winnerId: null,
    }));
  },

  pauseGame: () => set({ gameState: 'paused', buildMenuOpen: false }),
  resumeGame: () => set({ gameState: 'playing' }),

  gameOver: (victory, winnerId) => set({
    gameState: victory ? 'victory' : 'gameover',
    buildMenuOpen: false,
    winnerId: winnerId || null,
  }),

  toggleBuildMenu: () => set((s) => ({ buildMenuOpen: !s.buildMenuOpen })),

  // --- World ---

  updateWaterLevel: (delta) => set((state) => {
    const newLevel = state.world.waterLevel + delta;
    return {
      world: { ...state.world, waterLevel: newLevel, tideWarning: newLevel > 0 },
    };
  }),

  updateStormIntensity: (intensity) => set((state) => ({
    world: { ...state.world, stormIntensity: Math.max(0, Math.min(1, intensity)) },
  })),

  incrementDay: () => set((state) => ({
    world: {
      ...state.world,
      dayNumber: state.world.dayNumber + 1,
      waterRiseRate: state.world.waterRiseRate * 1.05,
    },
  })),

  // --- Player actions ---

  addResource: (resource, amount, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, (p) => ({
        inventory: { ...p.inventory, [resource]: p.inventory[resource] + amount },
      })),
    }));
  },

  removeResource: (resource, amount, playerId) => {
    const id = playerId || get().localPlayerId;
    const player = get().players[id];
    if (!player || player.inventory[resource] < amount) return false;
    set((state) => ({
      players: updatePlayer(state, id, (p) => ({
        inventory: { ...p.inventory, [resource]: p.inventory[resource] - amount },
      })),
    }));
    return true;
  },

  updateHealth: (amount, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, (p) => ({
        health: Math.max(0, Math.min(p.maxHealth, p.health + amount)),
      })),
    }));
  },

  updateStamina: (amount, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, (p) => ({
        stamina: Math.max(0, Math.min(p.maxStamina, p.stamina + amount)),
      })),
    }));
  },

  updateFaith: (amount, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, (p) => ({
        faith: Math.max(0, Math.min(p.maxFaith, p.faith + amount)),
      })),
    }));
  },

  setPlayerPosition: (pos, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, () => ({ position: pos })),
    }));
  },

  switchTool: (tool, playerId) => {
    const id = playerId || get().localPlayerId;
    set((state) => ({
      players: updatePlayer(state, id, () => ({ tool })),
    }));
  },

  // --- Ark actions ---

  placeArk: (pos, playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const ark = state.arks[id];
    if (!ark || ark.position !== null) return;
    set({
      arks: updateArk(state, id, () => ({ position: pos })),
      scores: { ...state.scores, [id]: (state.scores[id] || 0) + 50 },
    });
    if (id === get().localPlayerId) SFX.placeArk();
  },

  buildArkSection: (playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const player = state.players[id];
    const ark = state.arks[id];
    if (!player || !ark || !ark.position) return;
    if (player.inventory.wood < 10 || ark.sectionsBuilt >= ark.totalSections) return;

    set({
      players: updatePlayer(state, id, (p) => ({
        inventory: { ...p.inventory, wood: p.inventory.wood - 10 },
      })),
      arks: updateArk(state, id, (a) => ({
        sectionsBuilt: a.sectionsBuilt + 1,
        buoyancy: ((a.sectionsBuilt + 1) / a.totalSections) * 100,
      })),
      scores: { ...state.scores, [id]: (state.scores[id] || 0) + 100 },
    });
    if (id === get().localPlayerId) SFX.build();
  },

  coatWithPitch: (playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const player = state.players[id];
    const ark = state.arks[id];
    if (!player || !ark) return;
    if (player.inventory.pitch < 5 || ark.pitchCoated >= ark.sectionsBuilt) return;

    set({
      players: updatePlayer(state, id, (p) => ({
        inventory: { ...p.inventory, pitch: p.inventory.pitch - 5 },
      })),
      arks: updateArk(state, id, (a) => ({
        pitchCoated: a.pitchCoated + 1,
      })),
      scores: { ...state.scores, [id]: (state.scores[id] || 0) + 50 },
    });
    if (id === get().localPlayerId) SFX.coatPitch();
  },

  boardAnimal: (animalId, playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const ark = state.arks[id];
    if (!ark || ark.boardedAnimalIds.includes(animalId)) return;
    if (ark.animalsBoarded >= ark.totalAnimals) return;

    // Check animal isn't already boarded by someone else
    const animal = state.animalStates.find((a) => a.id === animalId);
    if (!animal || animal.boardedByPlayerId !== null) return;

    // In versus mode, check unique species requirement
    if (state.matchConfig.mode === 'versus') {
      const alreadyHasSpecies = ark.boardedAnimalIds.some((aid) => {
        const a = state.animalStates.find((x) => x.id === aid);
        return a && a.species === animal.species;
      });
      if (alreadyHasSpecies) return; // already have one of this species
    }

    set({
      arks: updateArk(state, id, (a) => ({
        animalsBoarded: a.animalsBoarded + 1,
        boardedAnimalIds: [...a.boardedAnimalIds, animalId],
      })),
      animalStates: state.animalStates.map((a) =>
        a.id === animalId ? { ...a, boardedByPlayerId: id, followingPlayerId: null } : a,
      ),
      scores: { ...state.scores, [id]: (state.scores[id] || 0) + 200 },
    });
    if (id === get().localPlayerId) SFX.boardAnimal();
  },

  // --- Resource nodes ---

  gatherResource: (nodeId, playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const node = state.resourceNodes.find((n) => n.id === nodeId);
    if (!node || node.amount <= 0) return false;

    // Check lock
    const now = Date.now();
    if (node.lockedBy && node.lockedBy !== id && node.lockedUntil > now) return false;

    // Deplete 1 unit and lock for 2s
    set({
      resourceNodes: state.resourceNodes.map((n) =>
        n.id === nodeId
          ? { ...n, amount: n.amount - 1, lockedBy: id, lockedUntil: now + 2000 }
          : n,
      ),
    });

    // Add to player inventory
    get().addResource(node.type, 1, id);
    get().updateFaith(1, id);
    if (id === get().localPlayerId) SFX.gather();
    return true;
  },

  clearStaleLocks: () => {
    const now = Date.now();
    set((state) => {
      let changed = false;
      const newNodes = state.resourceNodes.map((n) => {
        if (n.lockedBy && n.lockedUntil <= now) {
          changed = true;
          return { ...n, lockedBy: null, lockedUntil: 0 };
        }
        return n;
      });
      return changed ? { resourceNodes: newNodes } : {};
    });
  },

  // --- Animals ---

  updateAnimalPosition: (animalId, pos) => set((state) => ({
    animalStates: state.animalStates.map((a) =>
      a.id === animalId ? { ...a, position: pos } : a,
    ),
  })),

  setAnimalFollowing: (animalId, playerId) => set((state) => ({
    animalStates: state.animalStates.map((a) =>
      a.id === animalId ? { ...a, followingPlayerId: playerId } : a,
    ),
  })),

  // --- Divine Intervention ---

  useDivineIntervention: (power, targetId, playerId) => {
    const id = playerId || get().localPlayerId;
    const state = get();
    const player = state.players[id];
    if (!player || player.faith < 100) return;

    const effect: ActiveEffect = {
      type: power,
      expiresAt: Date.now() + (power === 'revelation' ? 30000 : power === 'speed_blessing' ? 20000 : 0),
      targetPlayerId: targetId,
    };

    // Apply immediate effects
    if (power === 'plague_of_locusts' && targetId) {
      const target = state.players[targetId];
      if (target) {
        const newFood = Math.floor(target.inventory.food / 2);
        set({
          players: {
            ...updatePlayer(state, id, (p) => ({
              faith: 50,
              activeEffects: [...p.activeEffects, effect],
            })),
            [targetId]: {
              ...target,
              inventory: { ...target.inventory, food: newFood },
            },
          },
          showDivineIntervention: false,
        });
        if (id === get().localPlayerId) SFX.divineIntervention();
        // Shake camera for the caster; shake harder if the local player is the target
        get().triggerCameraShake(2.0);
        if (targetId === get().localPlayerId) {
          get().triggerCameraShake(3.0);
        }
        return;
      }
    }

    // Duration effects (revelation, speed blessing)
    set({
      players: updatePlayer(state, id, (p) => ({
        faith: 50,
        activeEffects: [...p.activeEffects, effect],
      })),
      showDivineIntervention: false,
    });
    if (id === get().localPlayerId) SFX.divineIntervention();
    // Shake camera whenever a divine power is activated
    get().triggerCameraShake(2.0);
  },

  clearExpiredEffects: () => {
    const now = Date.now();
    set((state) => {
      const newPlayers = { ...state.players };
      let changed = false;
      for (const [pid, player] of Object.entries(newPlayers)) {
        const filtered = player.activeEffects.filter(
          (e) => e.expiresAt === 0 || e.expiresAt > now,
        );
        if (filtered.length !== player.activeEffects.length) {
          newPlayers[pid] = { ...player, activeEffects: filtered };
          changed = true;
        }
      }
      return changed ? { players: newPlayers } : {};
    });
  },

  setShowDivineIntervention: (show) => set({ showDivineIntervention: show }),

  // --- Fog of war ---

  discoverArk: (arkPlayerId) => set((state) => {
    if (state.discoveredArkIds.includes(arkPlayerId)) return {};
    return { discoveredArkIds: [...state.discoveredArkIds, arkPlayerId] };
  }),

  // --- Camera ---

  setCameraRotation: (r) => set({ cameraRotation: r }),
  triggerCameraShake: (intensity) => set({ cameraShake: intensity }),

  // --- Scoreboard ---

  toggleScoreboard: () => set((s) => ({ scoreboardOpen: !s.scoreboardOpen })),
}));

// --- Selector helpers for backward compatibility ---
// Use these in components that previously read s.player, s.ark, s.score

export const selectLocalPlayer = (s: GameStore) => s.players[s.localPlayerId];
export const selectLocalArk = (s: GameStore) => s.arks[s.localPlayerId];
export const selectLocalScore = (s: GameStore) => s.scores[s.localPlayerId] ?? 0;

/** Check if a player has an active effect of the given type */
export function hasActiveEffect(player: PlayerState, type: DivinePower): boolean {
  const now = Date.now();
  return player.activeEffects.some(
    (e) => e.type === type && (e.expiresAt === 0 || e.expiresAt > now),
  );
}

/** Get all player IDs */
export const selectAllPlayerIds = (s: GameStore) => Object.keys(s.players);

/** Get rival player IDs (all except local) */
export const selectRivalIds = (s: GameStore) =>
  Object.keys(s.players).filter((id) => id !== s.localPlayerId);
