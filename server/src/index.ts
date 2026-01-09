import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  JoinMatchPayload,
  MatchJoinedPayload,
  GameStateUpdatePayload,
  PlayerActionPayload,
  GameOverPayload,
  GameState,
  Player,
  SendUnitsPayload,
} from '@flavortown/shared';
import { JoinMatchSchema, PlayerActionSchema, SendUnitsSchema } from '@flavortown/shared';
import { GameEngine } from './GameEngine';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory game engines
const gameEngines = new Map<string, GameEngine>();
const playerToMatch = new Map<string, string>();

// Matchmaking queue
const matchmakingQueue: Array<{ socketId: string; username: string }> = [];

// Helper to get player color
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
let colorIndex = 0;

// Matchmaking function
function tryMatchmaking() {
  if (matchmakingQueue.length >= 2) {
    // Take first 2 players from queue
    const player1 = matchmakingQueue.shift()!;
    const player2 = matchmakingQueue.shift()!;

    // Create new match
    const matchId = `match_${Date.now()}`;
    
    console.log(`Creating match ${matchId} for ${player1.username} vs ${player2.username}`);

    // Send match found notification to both players
    io.to(player1.socketId).emit('match_found', { matchId, username: player1.username });
    io.to(player2.socketId).emit('match_found', { matchId, username: player2.username });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('queue_join', (payload: { username: string }) => {
    try {
      const { username } = payload;
      
      if (!username || username.trim().length === 0) {
        socket.emit('error', { message: 'Username required' });
        return;
      }

      // Check if already in queue
      const alreadyInQueue = matchmakingQueue.some(p => p.socketId === socket.id);
      if (alreadyInQueue) {
        socket.emit('error', { message: 'Already in queue' });
        return;
      }

      // Add to queue
      matchmakingQueue.push({ socketId: socket.id, username: username.trim() });
      console.log(`${username} joined matchmaking queue (${matchmakingQueue.length} players waiting)`);

      // Notify player they're in queue
      socket.emit('queue_joined', { position: matchmakingQueue.length });

      // Try to make a match
      tryMatchmaking();
    } catch (error) {
      console.error('Error joining queue:', error);
      socket.emit('error', { message: 'Failed to join queue' });
    }
  });

  socket.on('join_match', (payload: JoinMatchPayload) => {
    try {
      // Validate payload
      const validated = JoinMatchSchema.parse(payload);
      
      // Create or join match
      let matchId = validated.matchId || `match_${Date.now()}`;
      let engine = gameEngines.get(matchId);

      if (!engine) {
        // Create new game engine with state update callback
        engine = new GameEngine(
          matchId, 
          (state: GameState) => {
            // Broadcast game state updates to all players in match
            const update: GameStateUpdatePayload = {
              gameState: state,
            };
            io.to(matchId).emit('game_state_update', update);
          },
          (winnerId: string, winnerName: string, reason: string) => {
            // Broadcast game over event
            const gameOverPayload: GameOverPayload = {
              matchId,
              winner: winnerId,
              reason,
            };
            io.to(matchId).emit('game_over', gameOverPayload);
            console.log(`Game ${matchId} ended: ${winnerName} wins - ${reason}`);
          }
        );
        gameEngines.set(matchId, engine);
      }

      // Create player
      const player: Player = {
        id: socket.id,
        username: validated.username,
        color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
      };
      colorIndex++;

      // Add player to game engine
      engine.addPlayer(player);
      playerToMatch.set(socket.id, matchId);

      // Join socket room
      socket.join(matchId);

      // Get current game state
      const gameState = engine.getState();

      // Notify player they joined
      const response: MatchJoinedPayload = {
        matchId,
        playerId: socket.id,
        players: gameState.players,
      };
      socket.emit('match_joined', response);

      // Broadcast initial game state
      const stateUpdate: GameStateUpdatePayload = {
        gameState,
      };
      io.to(matchId).emit('game_state_update', stateUpdate);

      console.log(`Player ${validated.username} joined match ${matchId}`);
    } catch (error) {
      console.error('Error joining match:', error);
      socket.emit('error', { message: 'Failed to join match' });
    }
  });

  socket.on('player_action', (payload: PlayerActionPayload) => {
    try {
      // Validate payload
      const validated = PlayerActionSchema.parse(payload);
      
      const matchId = playerToMatch.get(socket.id);
      if (!matchId) return;

      const engine = gameEngines.get(matchId);
      if (!engine) return;

      // Handle different action types
      if (validated.action === 'interact' && validated.data.target) {
        // Capture base logic could go here
        // For now, just log it
        console.log(`Player ${validated.playerId} interacting with ${validated.data.target}`);
      }

      // Game state updates are handled by engine tick system
    } catch (error) {
      console.error('Error processing player action:', error);
    }
  });

  socket.on('send_units', (payload: SendUnitsPayload) => {
    try {
      // Validate payload
      const validated = SendUnitsSchema.parse(payload);

      const matchId = playerToMatch.get(socket.id);
      if (!matchId) {
        socket.emit('error', { message: 'Not in a match' });
        return;
      }

      const engine = gameEngines.get(matchId);
      if (!engine) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      // Send units
      const result = engine.sendUnits(
        validated.playerId,
        validated.fromBaseId,
        validated.toBaseId,
        validated.unitCount
      );

      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }

      // Broadcast updated state immediately
      const gameState = engine.getState();
      const stateUpdate: GameStateUpdatePayload = {
        gameState,
      };
      io.to(matchId).emit('game_state_update', stateUpdate);
    } catch (error) {
      console.error('Error sending units:', error);
      socket.emit('error', { message: 'Failed to send units' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Remove from matchmaking queue if present
    const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      const removed = matchmakingQueue.splice(queueIndex, 1);
      console.log(`${removed[0].username} removed from matchmaking queue`);
    }

    const matchId = playerToMatch.get(socket.id);
    if (matchId) {
      const engine = gameEngines.get(matchId);
      if (engine) {
        // Remove player from engine
        engine.removePlayer(socket.id);

        // If no players left, clean up engine
        const gameState = engine.getState();
        if (gameState.players.length === 0) {
          engine.stopGame();
          gameEngines.delete(matchId);
          console.log(`Match ${matchId} deleted (no players)`);
        }
      }
      playerToMatch.delete(socket.id);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Socket.io enabled`);
});
