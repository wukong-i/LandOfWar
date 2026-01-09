import { z } from 'zod';

// Player types
export interface Player {
  id: string;
  username: string;
  color: string;
}

// Base/Node types
export interface Base {
  id: string;
  x: number;
  y: number;
  ownerId: string | null; // null = neutral
  unitCount: number;
  productionRate: number; // units per tick
}

// Moving unit groups
export interface UnitGroup {
  id: string;
  fromBaseId: string;
  toBaseId: string;
  ownerId: string;
  unitCount: number;
  progress: number; // 0 to 1 (0 = just left, 1 = arrived)
  speed: number; // progress increment per tick
}

// Game state
export interface GameState {
  matchId: string;
  players: Player[];
  bases: Base[];
  unitGroups: UnitGroup[];
  status: 'waiting' | 'playing' | 'finished';
  startTime?: number;
  currentTick: number;
}

// Socket.io event payloads
export interface JoinMatchPayload {
  username: string;
  matchId?: string;
}

export interface MatchJoinedPayload {
  matchId: string;
  playerId: string;
  players: Player[];
}

export interface GameStateUpdatePayload {
  gameState: GameState;
}

export interface PlayerActionPayload {
  playerId: string;
  action: 'move' | 'interact';
  data: {
    x?: number;
    y?: number;
    target?: string;
  };
}

export interface SendUnitsPayload {
  playerId: string;
  fromBaseId: string;
  toBaseId: string;
  unitCount: number;
}

export interface GameOverPayload {
  matchId: string;
  winner?: string;
  reason: string;
}

// Zod schemas for validation
export const JoinMatchSchema = z.object({
  username: z.string().min(1).max(20),
  matchId: z.string().optional(),
});

export const PlayerActionSchema = z.object({
  playerId: z.string(),
  action: z.enum(['move', 'interact']),
  data: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    target: z.string().optional(),
  }),
});

export const SendUnitsSchema = z.object({
  playerId: z.string(),
  fromBaseId: z.string(),
  toBaseId: z.string(),
  unitCount: z.number().int().positive(),
});
