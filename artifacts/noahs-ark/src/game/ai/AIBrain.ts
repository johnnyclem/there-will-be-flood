import { useGameStore } from '../../store/gameStore';
import type { AIDifficulty, DivinePower } from '../../store/gameStore';
import { findArkPlacement, randomExploreTarget } from './AINavigation';

// --- Public types ---

export type AIGoal =
  | 'EXPLORING'
  | 'GATHERING'
  | 'BUILDING'
  | 'HERDING'
  | 'RACING'
  | 'USING_POWER';

export interface AIDecision {
  goal: AIGoal;
  targetPosition: [number, number, number] | null;
  targetResourceId: number | null;
  targetAnimalId: number | null;
  action: 'MOVE' | 'GATHER' | 'BUILD' | 'COAT' | 'BOARD' | 'PLACE_ARK' | 'USE_POWER' | 'IDLE';
}

export type { AIDifficulty };

export interface AIConfig {
  difficulty: AIDifficulty;
  /** How far the AI can "see" resources and animals */
  visionRadius: number;
  /** Multiplier applied to base movement speed (8 units/s) */
  speedMultiplier: number;
  /** How often (seconds) the AI re-evaluates its goal */
  decisionDelay: number;
  /** Whether this AI will try to herd animals being followed by the human */
  contestsAnimals: boolean;
  /** Whether this AI will steal animals already being herded by the human */
  stealsHerdedAnimals: boolean;
  /** Whether this AI uses divine intervention powers */
  usesDivineIntervention: boolean;
}

export const AI_CONFIGS: Record<AIDifficulty, AIConfig> = {
  apprentice: {
    difficulty: 'apprentice',
    visionRadius: 20,
    speedMultiplier: 0.9,
    decisionDelay: 3.0,
    contestsAnimals: false,
    stealsHerdedAnimals: false,
    usesDivineIntervention: false,
  },
  prophet: {
    difficulty: 'prophet',
    visionRadius: 35,
    speedMultiplier: 1.0,
    decisionDelay: 2.0,
    contestsAnimals: true,  // ~30% chance applied in decision logic
    stealsHerdedAnimals: false,
    usesDivineIntervention: true,  // Revelation only
  },
  patriarch: {
    difficulty: 'patriarch',
    visionRadius: 50,
    speedMultiplier: 1.0,
    decisionDelay: 1.5,
    contestsAnimals: true,
    stealsHerdedAnimals: true,
    usesDivineIntervention: true,
  },
};

// Distance squared helpers
function distSq(
  ax: number, az: number,
  bx: number, bz: number,
): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

/**
 * Stateful AI brain. One instance per AI player. Call `decide()` on a timer
 * to get the latest AIDecision, then `tick()` every frame to accumulate time
 * and fire one-shot actions (gather, build, board).
 */
export class AIBrain {
  private readonly playerId: string;
  readonly config: AIConfig;

  // Decision re-evaluation timer
  private decisionTimer = 0;
  private currentDecision: AIDecision = {
    goal: 'EXPLORING',
    targetPosition: null,
    targetResourceId: null,
    targetAnimalId: null,
    action: 'IDLE',
  };

  // Gathering cooldown (0.5 s per gather)
  private gatherTimer = 0;
  private readonly GATHER_INTERVAL = 0.5;

  // Build/coat cooldown
  private buildTimer = 0;
  private readonly BUILD_INTERVAL = 1.0;

  // Random state for probabilistic choices
  private rng: () => number;

  constructor(playerId: string, difficulty: AIDifficulty) {
    this.playerId = playerId;
    this.config = AI_CONFIGS[difficulty];
    // Simple seeded PRNG so behaviour is deterministic per player
    let seed = playerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    this.rng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Must be called every frame with the frame delta time.
   * Decrements timers and fires store actions when the AI is at its target.
   * Returns true if the goal/position was re-evaluated this frame.
   */
  tick(delta: number): boolean {
    this.gatherTimer = Math.max(0, this.gatherTimer - delta);
    this.buildTimer = Math.max(0, this.buildTimer - delta);

    this.decisionTimer -= delta;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = this.config.decisionDelay;
      this.currentDecision = this.evaluate();
      return true;
    }
    return false;
  }

  /** Current cached decision — valid until next `tick()` re-evaluation. */
  getDecision(): AIDecision {
    return this.currentDecision;
  }

  /**
   * Call this when the AI has physically arrived at its target position
   * (caller determines "arrived" as within ~1 unit).
   * Executes the appropriate store action if cooldown allows.
   */
  executeArrivalAction(): void {
    const { action, targetResourceId, targetAnimalId } = this.currentDecision;
    const store = useGameStore.getState();

    switch (action) {
      case 'GATHER': {
        if (targetResourceId !== null && this.gatherTimer === 0) {
          const gathered = store.gatherResource(targetResourceId, this.playerId);
          if (gathered) {
            this.gatherTimer = this.GATHER_INTERVAL;
          } else {
            // Node depleted — re-evaluate immediately
            this.decisionTimer = 0;
          }
        }
        break;
      }

      case 'BUILD': {
        if (this.buildTimer === 0) {
          store.buildArkSection(this.playerId);
          this.buildTimer = this.BUILD_INTERVAL;
          // Re-evaluate soon: maybe we need to keep building or switch goal
          this.decisionTimer = Math.min(this.decisionTimer, 0.5);
        }
        break;
      }

      case 'COAT': {
        if (this.buildTimer === 0) {
          store.coatWithPitch(this.playerId);
          this.buildTimer = this.BUILD_INTERVAL;
          this.decisionTimer = Math.min(this.decisionTimer, 0.5);
        }
        break;
      }

      case 'BOARD': {
        if (targetAnimalId !== null && this.buildTimer === 0) {
          store.boardAnimal(targetAnimalId, this.playerId);
          this.buildTimer = this.BUILD_INTERVAL;
          this.decisionTimer = 0; // immediately pick next animal
        }
        break;
      }

      case 'PLACE_ARK': {
        const { targetPosition } = this.currentDecision;
        if (targetPosition) {
          store.placeArk(targetPosition, this.playerId);
          this.decisionTimer = 0; // re-evaluate now that ark is placed
        }
        break;
      }

      case 'USE_POWER': {
        this.fireDivinePower();
        this.decisionTimer = 0;
        break;
      }

      default:
        break;
    }
  }

  /**
   * Call when the AI walks within `herdRadius` (5 units) of its target animal
   * to register "herding" (makes the animal follow this AI).
   */
  tryHerd(animalId: number): void {
    useGameStore.getState().setAnimalFollowing(animalId, this.playerId);
  }

  // ---------------------------------------------------------------------------
  // Internal: Decision evaluation (priority-ordered)
  // ---------------------------------------------------------------------------

  private evaluate(): AIDecision {
    const store = useGameStore.getState();
    const player = store.players[this.playerId];
    const ark = store.arks[this.playerId];

    if (!player || !ark) {
      return this.idleDecision();
    }

    const pos = player.position;
    const inv = player.inventory;

    // ---- Priority 1: Low health AND has food → move to safe high ground ----
    if (player.health < 30 && inv.food > 0) {
      return this.survivalDecision(pos);
    }

    // ---- Priority 2: Ark not placed AND has any wood → find high ground + place ----
    if (ark.position === null && inv.wood > 0) {
      return this.placeArkDecision(pos);
    }

    // ---- Priority 3: Wood >= 10 AND near own ark → build section ----
    if (
      inv.wood >= 10 &&
      ark.position !== null &&
      ark.sectionsBuilt < ark.totalSections &&
      distSq(pos[0], pos[2], ark.position[0], ark.position[2]) <= 25 // within 5 units
    ) {
      return {
        goal: 'BUILDING',
        targetPosition: [...ark.position] as [number, number, number],
        targetResourceId: null,
        targetAnimalId: null,
        action: 'BUILD',
      };
    }

    // ---- Priority 4: Pitch >= 5 AND uncoated sections AND near own ark → coat ----
    if (
      inv.pitch >= 5 &&
      ark.position !== null &&
      ark.pitchCoated < ark.sectionsBuilt &&
      distSq(pos[0], pos[2], ark.position[0], ark.position[2]) <= 25
    ) {
      return {
        goal: 'BUILDING',
        targetPosition: [...ark.position] as [number, number, number],
        targetResourceId: null,
        targetAnimalId: null,
        action: 'COAT',
      };
    }

    // ---- Priority 5: Unboarded animal within vision AND ark has capacity → herd ----
    if (
      ark.position !== null &&
      ark.animalsBoarded < ark.totalAnimals
    ) {
      const herdDecision = this.findHerdTarget(pos, ark, store);
      if (herdDecision) return herdDecision;
    }

    // ---- Priority 6: Faith >= 100 AND usesDivineIntervention → use power ----
    if (player.faith >= 100 && this.config.usesDivineIntervention) {
      return {
        goal: 'USING_POWER',
        targetPosition: pos,
        targetResourceId: null,
        targetAnimalId: null,
        action: 'USE_POWER',
      };
    }

    // ---- Priority 7: Wood < 10 → gather nearest visible wood ----
    if (inv.wood < 10) {
      const woodDecision = this.findResourceDecision(pos, 'wood', store);
      if (woodDecision) return woodDecision;
    }

    // ---- Priority 8: Pitch < 5 AND wood >= 100 → gather nearest pitch ----
    if (inv.pitch < 5 && inv.wood >= 100) {
      const pitchDecision = this.findResourceDecision(pos, 'pitch', store);
      if (pitchDecision) return pitchDecision;
    }

    // ---- Priority 9 (continued gathering): Move toward ark to build ----
    // If we have wood >= 10 but ark is not nearby, walk toward it
    if (inv.wood >= 10 && ark.position !== null && ark.sectionsBuilt < ark.totalSections) {
      return {
        goal: 'BUILDING',
        targetPosition: [...ark.position] as [number, number, number],
        targetResourceId: null,
        targetAnimalId: null,
        action: 'MOVE',
      };
    }

    // ---- Priority 9: All sections built AND not all species boarded → herd ----
    if (
      ark.sectionsBuilt >= ark.totalSections &&
      ark.animalsBoarded < ark.totalAnimals &&
      ark.position !== null
    ) {
      const herdDecision = this.findHerdTarget(pos, ark, store);
      if (herdDecision) return herdDecision;
    }

    // ---- Priority 10: Default → explore ----
    return this.exploreDecision(pos);
  }

  // ---------------------------------------------------------------------------
  // Decision builders
  // ---------------------------------------------------------------------------

  private idleDecision(): AIDecision {
    return {
      goal: 'EXPLORING',
      targetPosition: null,
      targetResourceId: null,
      targetAnimalId: null,
      action: 'IDLE',
    };
  }

  private survivalDecision(pos: [number, number, number]): AIDecision {
    // Move to highest nearby terrain
    const target = findArkPlacement(pos, this.config.visionRadius);
    return {
      goal: 'EXPLORING',
      targetPosition: target,
      targetResourceId: null,
      targetAnimalId: null,
      action: 'MOVE',
    };
  }

  private placeArkDecision(pos: [number, number, number]): AIDecision {
    const target = findArkPlacement(pos, this.config.visionRadius);
    return {
      goal: 'BUILDING',
      targetPosition: target,
      targetResourceId: null,
      targetAnimalId: null,
      action: 'PLACE_ARK',
    };
  }

  private findResourceDecision(
    pos: [number, number, number],
    type: 'wood' | 'pitch',
    store: ReturnType<typeof useGameStore.getState>,
  ): AIDecision | null {
    const vr2 = this.config.visionRadius * this.config.visionRadius;
    const now = Date.now();

    let bestNode: typeof store.resourceNodes[number] | null = null;
    let bestDist = Infinity;

    for (const node of store.resourceNodes) {
      if (node.type !== type) continue;
      if (node.amount <= 0) continue;
      // Check if locked by someone else
      if (node.lockedBy && node.lockedBy !== this.playerId && node.lockedUntil > now) continue;

      const d = distSq(pos[0], pos[2], node.position[0], node.position[2]);
      if (d > vr2) continue;
      if (d < bestDist) {
        bestDist = d;
        bestNode = node;
      }
    }

    if (!bestNode) return null;

    return {
      goal: 'GATHERING',
      targetPosition: [...bestNode.position] as [number, number, number],
      targetResourceId: bestNode.id,
      targetAnimalId: null,
      action: 'GATHER',
    };
  }

  private findHerdTarget(
    pos: [number, number, number],
    ark: ReturnType<typeof useGameStore.getState>['arks'][string],
    store: ReturnType<typeof useGameStore.getState>,
  ): AIDecision | null {
    const vr2 = this.config.visionRadius * this.config.visionRadius;
    const localPlayerId = store.localPlayerId;

    // Collect species already boarded on our ark
    const boardedSpecies = new Set<string>();
    for (const aid of ark.boardedAnimalIds) {
      const a = store.animalStates.find((x) => x.id === aid);
      if (a) boardedSpecies.add(a.species);
    }

    let bestAnimal: typeof store.animalStates[number] | null = null;
    let bestDist = Infinity;

    for (const animal of store.animalStates) {
      if (animal.boardedByPlayerId !== null) continue; // already boarded
      if (boardedSpecies.has(animal.species)) continue; // we already have this species

      // Check if it is being herded by human
      const beingHerdedByHuman = animal.followingPlayerId === localPlayerId;

      if (beingHerdedByHuman) {
        if (this.config.stealsHerdedAnimals) {
          // patriarch: always contest
        } else if (this.config.contestsAnimals) {
          // prophet: ~30% chance to contest
          if (this.rng() > 0.3) continue;
        } else {
          // apprentice: never contest
          continue;
        }
      }

      const d = distSq(pos[0], pos[2], animal.position[0], animal.position[2]);
      if (d > vr2) continue;
      if (d < bestDist) {
        bestDist = d;
        bestAnimal = animal;
      }
    }

    if (!bestAnimal) return null;

    return {
      goal: 'HERDING',
      targetPosition: [...bestAnimal.position] as [number, number, number],
      targetResourceId: null,
      targetAnimalId: bestAnimal.id,
      action: 'MOVE',
    };
  }

  private exploreDecision(pos: [number, number, number]): AIDecision {
    const target = randomExploreTarget(pos, 30 + this.rng() * 20);
    return {
      goal: 'EXPLORING',
      targetPosition: target,
      targetResourceId: null,
      targetAnimalId: null,
      action: 'MOVE',
    };
  }

  // ---------------------------------------------------------------------------
  // Divine intervention strategy
  // ---------------------------------------------------------------------------

  private fireDivinePower(): void {
    const store = useGameStore.getState();
    const localPlayerId = store.localPlayerId;
    const localArk = store.arks[localPlayerId];
    const myArk = store.arks[this.playerId];

    if (this.config.difficulty === 'apprentice') return;

    let power: DivinePower;

    if (this.config.difficulty === 'prophet') {
      // Prophet: only Revelation (reveals the map / more resources visible)
      power = 'revelation';
    } else {
      // Patriarch: strategic selection
      const myProgress = myArk ? myArk.sectionsBuilt / myArk.totalSections : 0;
      const localProgress = localArk ? localArk.sectionsBuilt / localArk.totalSections : 0;

      if (myProgress < localProgress - 0.2) {
        // We are significantly behind — use plague to slow human down
        power = 'plague_of_locusts';
      } else if (myArk && myArk.sectionsBuilt >= myArk.totalSections * 0.7) {
        // We are close to finishing — speed blessing to race ahead
        power = 'speed_blessing';
      } else {
        // Early/mid game — revelation to find resources faster
        power = 'revelation';
      }
    }

    // Plague targets the local player; other powers target self
    const targetId = power === 'plague_of_locusts' ? localPlayerId : this.playerId;
    store.useDivineIntervention(power, targetId, this.playerId);
  }
}
