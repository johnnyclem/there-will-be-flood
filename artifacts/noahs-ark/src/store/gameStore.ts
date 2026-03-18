import { create } from 'zustand';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface Inventory {
  wood: number;
  pitch: number;
  food: number;
  gopherWood: number;
  holyArtifacts: number;
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
  position: [number, number, number] | null; // null = not yet placed
}

export interface WorldState {
  waterLevel: number;
  waterRiseRate: number;
  stormIntensity: number;
  dayNumber: number;
  timeOfDay: number;
  tideWarning: boolean;
}

interface GameStore {
  gameState: GameState;
  player: PlayerState;
  ark: ArkState;
  world: WorldState;
  score: number;
  resetCounter: number;
  setGameState: (state: GameState) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: (victory: boolean) => void;
  updateWaterLevel: (delta: number) => void;
  updateStormIntensity: (intensity: number) => void;
  addResource: (resource: keyof Inventory, amount: number) => void;
  removeResource: (resource: keyof Inventory, amount: number) => boolean;
  updateHealth: (amount: number) => void;
  updateStamina: (amount: number) => void;
  updateFaith: (amount: number) => void;
  buildArkSection: () => void;
  coatWithPitch: () => void;
  boardAnimal: (animalId: number) => void;
  placeArk: (pos: [number, number, number]) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  switchTool: (tool: 'axe' | 'hammer' | 'staff') => void;
  incrementDay: () => void;
}

const initialPlayer: PlayerState = {
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  faith: 50,
  maxFaith: 100,
  position: [0, 2, 0],
  inventory: {
    wood: 0,
    pitch: 0,
    food: 10,
    gopherWood: 0,
    holyArtifacts: 0,
  },
  tool: 'axe',
};

const initialArk: ArkState = {
  sectionsBuilt: 0,
  totalSections: 30,
  pitchCoated: 0,
  animalsBoarded: 0,
  totalAnimals: 14,
  boardedAnimalIds: [],
  buoyancy: 0,
  integrity: 100,
  position: null,
};

const initialWorld: WorldState = {
  waterLevel: -2,
  waterRiseRate: 0.002,
  stormIntensity: 0,
  dayNumber: 1,
  timeOfDay: 0.5,
  tideWarning: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  player: { ...initialPlayer },
  ark: { ...initialArk },
  world: { ...initialWorld },
  score: 0,
  resetCounter: 0,

  setGameState: (state) => set({ gameState: state }),

  startGame: () => set((state) => ({
    gameState: 'playing',
    player: { ...initialPlayer },
    ark: { ...initialArk },
    world: { ...initialWorld },
    score: 0,
    resetCounter: state.resetCounter + 1,
  })),

  pauseGame: () => set({ gameState: 'paused' }),
  resumeGame: () => set({ gameState: 'playing' }),

  gameOver: (victory) => set({ gameState: victory ? 'victory' : 'gameover' }),

  updateWaterLevel: (delta) => set((state) => {
    const newLevel = state.world.waterLevel + delta;
    const tideWarning = newLevel > 0;
    return {
      world: { ...state.world, waterLevel: newLevel, tideWarning },
    };
  }),

  updateStormIntensity: (intensity) => set((state) => ({
    world: { ...state.world, stormIntensity: Math.max(0, Math.min(1, intensity)) },
  })),

  addResource: (resource, amount) => set((state) => ({
    player: {
      ...state.player,
      inventory: {
        ...state.player.inventory,
        [resource]: state.player.inventory[resource] + amount,
      },
    },
  })),

  removeResource: (resource, amount) => {
    const current = get().player.inventory[resource];
    if (current < amount) return false;
    set((state) => ({
      player: {
        ...state.player,
        inventory: {
          ...state.player.inventory,
          [resource]: state.player.inventory[resource] - amount,
        },
      },
    }));
    return true;
  },

  updateHealth: (amount) => set((state) => ({
    player: {
      ...state.player,
      health: Math.max(0, Math.min(state.player.maxHealth, state.player.health + amount)),
    },
  })),

  updateStamina: (amount) => set((state) => ({
    player: {
      ...state.player,
      stamina: Math.max(0, Math.min(state.player.maxStamina, state.player.stamina + amount)),
    },
  })),

  updateFaith: (amount) => set((state) => ({
    player: {
      ...state.player,
      faith: Math.max(0, Math.min(state.player.maxFaith, state.player.faith + amount)),
    },
  })),

  placeArk: (pos) => {
    const state = get();
    if (state.ark.position !== null) return; // already placed
    set({
      ark: { ...state.ark, position: pos },
      score: state.score + 50,
    });
  },

  buildArkSection: () => {
    const state = get();
    if (!state.ark.position) return; // must place first
    if (state.player.inventory.wood >= 10 && state.ark.sectionsBuilt < state.ark.totalSections) {
      set({
        player: {
          ...state.player,
          inventory: { ...state.player.inventory, wood: state.player.inventory.wood - 10 },
        },
        ark: {
          ...state.ark,
          sectionsBuilt: state.ark.sectionsBuilt + 1,
          buoyancy: ((state.ark.sectionsBuilt + 1) / state.ark.totalSections) * 100,
        },
        score: state.score + 100,
      });
    }
  },

  coatWithPitch: () => {
    const state = get();
    if (state.player.inventory.pitch >= 5 && state.ark.pitchCoated < state.ark.sectionsBuilt) {
      set({
        player: {
          ...state.player,
          inventory: { ...state.player.inventory, pitch: state.player.inventory.pitch - 5 },
        },
        ark: { ...state.ark, pitchCoated: state.ark.pitchCoated + 1 },
        score: state.score + 50,
      });
    }
  },

  boardAnimal: (animalId: number) => {
    const state = get();
    if (state.ark.boardedAnimalIds.includes(animalId)) return;
    if (state.ark.animalsBoarded >= state.ark.totalAnimals) return;
    set({
      ark: {
        ...state.ark,
        animalsBoarded: state.ark.animalsBoarded + 1,
        boardedAnimalIds: [...state.ark.boardedAnimalIds, animalId],
      },
      score: state.score + 200,
    });
  },

  setPlayerPosition: (pos) => set((state) => ({
    player: { ...state.player, position: pos },
  })),

  switchTool: (tool) => set((state) => ({
    player: { ...state.player, tool },
  })),

  incrementDay: () => set((state) => ({
    world: {
      ...state.world,
      dayNumber: state.world.dayNumber + 1,
      waterRiseRate: state.world.waterRiseRate * 1.05,
    },
  })),
}));
