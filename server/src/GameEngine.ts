import type { GameState, Base, Player, UnitGroup } from '@flavortown/shared';

export class GameEngine {
  private gameState: GameState;
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_RATE = 1000; // 1 second per tick
  private readonly UNIT_SPEED = 0.1; // 10% progress per tick (10 ticks to arrive)
  private onStateUpdate: (state: GameState) => void;
  private onGameOver: (winnerId: string, winnerName: string, reason: string) => void;
  private nextUnitGroupId = 0;

  constructor(
    matchId: string, 
    onStateUpdate: (state: GameState) => void,
    onGameOver: (winnerId: string, winnerName: string, reason: string) => void
  ) {
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;
    this.gameState = {
      matchId,
      players: [],
      bases: [],
      unitGroups: [],
      status: 'waiting',
      currentTick: 0,
    };

    // Initialize bases (neutral bases)
    this.initializeBases();
  }

  private initializeBases(): void {
    // Generate random base positions for variety
    // Use a seed-based or randomized approach for each match
    const baseCount = 5;
    const bases: Array<{ x: number; y: number }> = [];
    
    // Generate positions with some spacing
    const minDistance = 150;
    const maxAttempts = 100;
    
    for (let i = 0; i < baseCount; i++) {
      let attempts = 0;
      let position: { x: number; y: number };
      let validPosition = false;
      
      do {
        position = {
          x: 100 + Math.random() * 600, // 100-700 range
          y: 100 + Math.random() * 400, // 100-500 range
        };
        
        // Check distance from existing bases
        validPosition = bases.every(base => {
          const dx = base.x - position.x;
          const dy = base.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance >= minDistance;
        });
        
        attempts++;
      } while (!validPosition && attempts < maxAttempts);
      
      if (validPosition || attempts >= maxAttempts) {
        bases.push(position);
      }
    }

    this.gameState.bases = bases.map((pos, index) => ({
      id: `base_${index}`,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      ownerId: null, // neutral
      unitCount: 50, // neutral bases start with units
      productionRate: 0, // neutral bases don't produce
    }));
    
    console.log(`Generated ${this.gameState.bases.length} bases for match ${this.gameState.matchId}`);
  }

  addPlayer(player: Player): void {
    this.gameState.players.push(player);

    // Assign first base to player if available
    const neutralBase = this.gameState.bases.find((b: Base) => b.ownerId === null);
    if (neutralBase) {
      neutralBase.ownerId = player.id;
      neutralBase.unitCount = 100;
      neutralBase.productionRate = 5; // owned bases produce 5 units per tick
    }

    // Start game if we have at least 1 player
    if (this.gameState.players.length >= 1 && this.gameState.status === 'waiting') {
      this.startGame();
    }
  }

  removePlayer(playerId: string): void {
    // Remove player
    this.gameState.players = this.gameState.players.filter((p: Player) => p.id !== playerId);

    // Convert their bases to neutral
    this.gameState.bases.forEach((base: Base) => {
      if (base.ownerId === playerId) {
        base.ownerId = null;
        base.productionRate = 0; // neutral bases don't produce
      }
    });

    // Stop game if no players left
    if (this.gameState.players.length === 0) {
      this.stopGame();
    }
  }

  startGame(): void {
    if (this.gameState.status !== 'waiting') return;

    this.gameState.status = 'playing';
    this.gameState.startTime = Date.now();
    this.gameState.currentTick = 0;

    console.log(`Game ${this.gameState.matchId} started`);

    // Start tick loop
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.TICK_RATE);
  }

  stopGame(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.gameState.status = 'finished';
    console.log(`Game ${this.gameState.matchId} stopped`);
  }

  private tick(): void {
    this.gameState.currentTick++;

    // Process unit production for owned bases
    this.gameState.bases.forEach((base: Base) => {
      if (base.ownerId !== null && base.productionRate > 0) {
        base.unitCount += base.productionRate;
        // Cap units at 999
        base.unitCount = Math.min(base.unitCount, 999);
      }
    });

    // Process moving unit groups
    const arrivedGroups: UnitGroup[] = [];
    this.gameState.unitGroups = this.gameState.unitGroups.filter((group: UnitGroup) => {
      group.progress += group.speed;
      
      if (group.progress >= 1) {
        // Unit group has arrived
        arrivedGroups.push(group);
        return false; // Remove from array
      }
      return true; // Keep moving
    });

    // Process arrivals
    arrivedGroups.forEach(group => {
      this.processArrival(group);
    });

    // Check win condition on each tick (after processing arrivals)
    this.checkWinCondition();

    // Emit state update
    this.onStateUpdate(this.gameState);
  }

  private processArrival(group: UnitGroup): void {
    const targetBase = this.gameState.bases.find((b: Base) => b.id === group.toBaseId);
    if (!targetBase) return;

    if (targetBase.ownerId === group.ownerId) {
      // Reinforcement: same owner
      targetBase.unitCount += group.unitCount;
      console.log(`Base ${targetBase.id} reinforced with ${group.unitCount} units`);
    } else {
      // Attack: different owner or neutral
      const attackUnits = group.unitCount;
      const defenseUnits = targetBase.unitCount;
      const result = attackUnits - defenseUnits;

      if (result > 0) {
        // Attacker wins, capture base
        const previousOwner = targetBase.ownerId;
        targetBase.ownerId = group.ownerId;
        targetBase.unitCount = result;
        targetBase.productionRate = 5; // captured base becomes productive
        
        console.log(`Base ${targetBase.id} captured by ${group.ownerId}! (${attackUnits} vs ${defenseUnits})`);
        
        // Check win condition after capture
        this.checkWinCondition();
      } else {
        // Defender wins, reduce units
        targetBase.unitCount = Math.abs(result);
        console.log(`Base ${targetBase.id} defended! (${attackUnits} vs ${defenseUnits}, ${targetBase.unitCount} remaining)`);
      }
    }
  }

  private checkWinCondition(): void {
    // Only check during active game with multiple players
    if (this.gameState.status !== 'playing' || this.gameState.players.length < 2) {
      return;
    }

    // Count bases per player
    const playerBases = new Map<string, number>();
    this.gameState.players.forEach((player: Player) => {
      playerBases.set(player.id, 0);
    });

    this.gameState.bases.forEach((base: Base) => {
      if (base.ownerId) {
        const count = playerBases.get(base.ownerId) || 0;
        playerBases.set(base.ownerId, count + 1);
      }
    });

    const totalBases = this.gameState.bases.length;
    const playersWithBases = Array.from(playerBases.entries()).filter(([_, count]) => count > 0);

    // Win condition 1: All opponents eliminated (only one player has bases)
    if (playersWithBases.length === 1) {
      const [winnerId, baseCount] = playersWithBases[0];
      const winner = this.gameState.players.find((p: Player) => p.id === winnerId);
      if (winner) {
        console.log(`${winner.username} wins by elimination!`);
        this.stopGame();
        this.onGameOver(winnerId, winner.username, 'All opponents eliminated');
      }
      return;
    }

    // Win condition 2: Control 80% of bases
    for (const [playerId, baseCount] of playersWithBases) {
      const controlPercentage = (baseCount / totalBases) * 100;
      if (controlPercentage >= 80) {
        const winner = this.gameState.players.find((p: Player) => p.id === playerId);
        if (winner) {
          console.log(`${winner.username} wins by controlling ${controlPercentage.toFixed(0)}% of bases!`);
          this.stopGame();
          this.onGameOver(playerId, winner.username, `Controlled ${controlPercentage.toFixed(0)}% of bases`);
        }
        return;
      }
    }
  }

  private checkGameOver(): void {
    // Deprecated: Use checkWinCondition instead
    this.checkWinCondition();
  }

  getState(): GameState {
    return this.gameState;
  }

  sendUnits(playerId: string, fromBaseId: string, toBaseId: string, unitCount: number): { success: boolean; message: string } {
    // Validate bases exist
    const fromBase = this.gameState.bases.find((b: Base) => b.id === fromBaseId);
    const toBase = this.gameState.bases.find((b: Base) => b.id === toBaseId);

    if (!fromBase || !toBase) {
      return { success: false, message: 'Base not found' };
    }

    // Verify ownership
    if (fromBase.ownerId !== playerId) {
      return { success: false, message: 'You do not own this base' };
    }

    // Verify enough units (must leave at least 1 unit - anti-feedback loop)
    if (fromBase.unitCount - unitCount < 1) {
      return { success: false, message: 'Not enough units (must leave at least 1)' };
    }

    // Calculate distance for travel time
    const dx = toBase.x - fromBase.x;
    const dy = toBase.y - fromBase.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Speed based on distance (normalize so average distance takes ~10 ticks)
    const speed = this.UNIT_SPEED / (distance / 400); // 400 is roughly average distance

    // Create unit group
    const unitGroup: UnitGroup = {
      id: `ug_${this.nextUnitGroupId++}`,
      fromBaseId,
      toBaseId,
      ownerId: playerId,
      unitCount,
      progress: 0,
      speed: Math.min(speed, 0.5), // Cap max speed at 0.5 (2 ticks minimum)
    };

    // Deduct units from source base
    fromBase.unitCount -= unitCount;

    // Add to moving groups
    this.gameState.unitGroups.push(unitGroup);

    console.log(`Player ${playerId} sent ${unitCount} units from ${fromBaseId} to ${toBaseId}`);
    return { success: true, message: 'Units sent' };
  }

  captureBase(baseId: string, attackerId: string, unitsUsed: number): boolean {
    const base = this.gameState.bases.find((b: Base) => b.id === baseId);
    if (!base) return false;

    // Simple capture logic: if attacker has more units than base
    if (unitsUsed > base.unitCount) {
      const remainingUnits = unitsUsed - base.unitCount;
      
      // Change ownership
      const previousOwner = base.ownerId;
      base.ownerId = attackerId;
      base.unitCount = remainingUnits;
      base.productionRate = 5; // newly captured base produces units

      // If it was neutral, just log
      if (previousOwner === null) {
        console.log(`Base ${baseId} captured by ${attackerId}`);
      }

      return true;
    }

    // Attack failed, reduce base units
    base.unitCount -= unitsUsed;
    return false;
  }
}
