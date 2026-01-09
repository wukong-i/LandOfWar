import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  JoinMatchPayload,
  MatchJoinedPayload,
  GameStateUpdatePayload,
  PlayerActionPayload,
  GameOverPayload,
  GameState,
} from '@flavortown/shared';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const serverUrl = (import.meta as any).env.VITE_SERVER_URL || 'http://localhost:3001';
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Game events
    socket.on('match_joined', (payload: MatchJoinedPayload) => {
      console.log('Match joined:', payload);
      setMatchId(payload.matchId);
      setPlayerId(payload.playerId);
      setInQueue(false);
    });

    socket.on('queue_joined', (payload: { position: number }) => {
      console.log('Queue joined:', payload);
      setInQueue(true);
      setQueuePosition(payload.position);
    });

    socket.on('match_found', (payload: { matchId: string; username: string }) => {
      console.log('Match found:', payload);
      setInQueue(false);
      // Automatically join the match
      socket.emit('join_match', { username: payload.username, matchId: payload.matchId });
    });

    socket.on('game_state_update', (payload: GameStateUpdatePayload) => {
      console.log('Game state updated:', payload);
      setGameState(payload.gameState);
    });

    socket.on('game_over', (payload: GameOverPayload) => {
      console.log('Game over:', payload);
      setGameOver(payload);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const queueForMatch = (username: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('queue_join', { username });
  };

  const joinMatch = (username: string, matchId?: string) => {
    if (!socketRef.current) return;

    const payload: JoinMatchPayload = {
      username,
      matchId,
    };

    socketRef.current.emit('join_match', payload);
  };

  const sendPlayerAction = (action: PlayerActionPayload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('player_action', action);
  };

  const sendUnits = (fromBaseId: string, toBaseId: string, unitCount: number) => {
    if (!socketRef.current || !playerId) return;
    
    socketRef.current.emit('send_units', {
      playerId,
      fromBaseId,
      toBaseId,
      unitCount,
    });
  };

  return {
    isConnected,
    gameState,
    playerId,
    matchId,
    gameOver,
    inQueue,
    queuePosition,
    queueForMatch,
    joinMatch,
    sendPlayerAction,
    sendUnits,
  };
}
