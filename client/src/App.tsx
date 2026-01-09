import React, { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { GameCanvas } from './components/GameCanvas';
import { PageFlip } from './components/PageFlip';
import { StickyNote } from './components/StickyNote';

function App() {
  const { isConnected, gameState, playerId, matchId, gameOver, inQueue, queuePosition, queueForMatch, sendUnits } = useSocket();
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [showPageFlip, setShowPageFlip] = useState(false);

  const handlePlayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      queueForMatch(username)
      setHasJoined(true);
    }
  };

  const handleBaseClick = (baseId: string) => {
    const base = gameState?.bases.find((b: any) => b.id === baseId);
    if (!base) return;

    // First click: select a base owned by the player
    if (!selectedBase) {
      if (base.ownerId === playerId) {
        setSelectedBase(baseId);
      }
      return;
    }

    // If clicking the same base, deselect
    if (selectedBase === baseId) {
      setSelectedBase(null);
      return;
    }

    // Second click: send half units from selected base to target
    const sourceBase = gameState?.bases.find((b: any) => b.id === selectedBase);
    if (!sourceBase) return;

    // Calculate half units (leave at least 1)
    const halfUnits = Math.floor(sourceBase.unitCount / 2);
    const unitsToSend = Math.max(1, Math.min(halfUnits, sourceBase.unitCount - 1));

    if (unitsToSend > 0) {
      sendUnits(selectedBase, baseId, unitsToSend);
    }
    
    setSelectedBase(null);
  };

  const currentPlayer = gameState?.players.find((p: any) => p.id === playerId);
  const selectedBaseData = gameState?.bases.find((b: any) => b.id === selectedBase);
  const winner = gameOver?.winner ? gameState?.players.find((p: any) => p.id === gameOver.winner) : null;

  const handlePlayAgain = () => {
    setShowPageFlip(true);
  };

  const handlePageFlipComplete = () => {
    window.location.reload();
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#FFFEF0',
      backgroundImage: `
        repeating-linear-gradient(
          transparent,
          transparent 29px,
          rgba(156, 206, 234, 0.15) 29px,
          rgba(156, 206, 234, 0.15) 31px
        ),
        linear-gradient(
          to right,
          transparent 0px,
          transparent 58px,
          rgba(255, 107, 107, 0.2) 58px,
          rgba(255, 107, 107, 0.2) 60px,
          transparent 60px
        )
      `,
      padding: '40px 80px',
      fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif"
    }}>
      <h1 style={{ 
        fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif",
        fontSize: '48px',
        color: '#1a1a1a',
        marginBottom: '30px'
      }}>Land Of War</h1>
      
      <StickyNote color="blue" style={{ marginBottom: '20px', maxWidth: '300px' }}>
        <p style={{ margin: 0 }}>
          Connection: 
          <strong style={{ color: isConnected ? '#4caf50' : '#f44336', marginLeft: '8px' }}>
            {isConnected ? '● Online' : '○ Offline'}
          </strong>
        </p>
      </StickyNote>

      {!hasJoined ? (
        <StickyNote color="yellow" style={{ maxWidth: '400px' }}>
          <h2 style={{ marginTop: 0, fontSize: '28px' }}>Join Game</h2>
          <form onSubmit={handlePlayClick}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                padding: '12px', 
                marginRight: '10px', 
                fontSize: '18px',
                fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif",
                border: '2px solid #1a1a1a',
                borderRadius: '4px',
                width: '200px'
              }}
            />
            <button 
              type="submit" 
              disabled={!isConnected} 
              style={{ 
                padding: '12px 24px', 
                fontSize: '18px',
                fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif",
                backgroundColor: '#4caf50',
                color: 'white',
                border: '2px solid #1a1a1a',
                borderRadius: '4px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              Play!
            </button>
          </form>
        </StickyNote>
      ) : inQueue ? (
        <StickyNote color="yellow" style={{ maxWidth: '400px' }}>
          <h3 style={{ marginTop: 0, fontSize: '28px' }}>Finding Match...</h3>
          <p style={{ fontSize: '20px' }}>You are in the matchmaking queue</p>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Position: {queuePosition || '...'}
          </p>
          <div style={{ marginTop: '10px' }}>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#e0e0e0',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid #1a1a1a'
            }}>
              <div 
                style={{ 
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffc107',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              ></div>
            </div>
          </div>
          <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
            Waiting for opponent...
          </p>
        </StickyNote>
      ) : (
        <div>
          <StickyNote color="pink" style={{ marginBottom: '20px', maxWidth: '400px' }}>
            <p style={{ fontSize: '18px', margin: '8px 0' }}><strong>Match ID:</strong> {matchId}</p>
            <p style={{ fontSize: '18px', margin: '8px 0' }}><strong>Your ID:</strong> {playerId}</p>
            {currentPlayer && (
              <p style={{ fontSize: '18px', margin: '8px 0' }}>
                <strong>Your Color:</strong> 
                <span style={{ 
                  display: 'inline-block', 
                  width: '24px', 
                  height: '24px', 
                  backgroundColor: currentPlayer.color,
                  marginLeft: '8px',
                  border: '2px solid #1a1a1a',
                  verticalAlign: 'middle',
                  borderRadius: '2px'
                }}></span>
              </p>
            )}
          </StickyNote>

          {gameState && (
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Canvas */}
              <div>
                <GameCanvas 
                  gameState={gameState}
                  playerId={playerId}
                  onBaseClick={handleBaseClick}
                  selectedBase={selectedBase}
                />
                
                {selectedBase && selectedBaseData && (
                  <StickyNote color="green" style={{ marginTop: '12px', maxWidth: '800px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '20px' }}>
                      {selectedBase} selected ({selectedBaseData.unitCount} units)
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '18px', color: '#666' }}>
                      Click another base to send {Math.max(1, Math.min(Math.floor(selectedBaseData.unitCount / 2), selectedBaseData.unitCount - 1))} units
                    </p>
                  </StickyNote>
                )}
              </div>

              {/* Side panel with game info */}
              <div style={{ minWidth: '280px' }}>
                <StickyNote color="blue" style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, fontSize: '24px' }}>Game Status</h3>
                  <p style={{ fontSize: '18px', margin: '8px 0' }}><strong>Status:</strong> {gameState.status}</p>
                  <p style={{ fontSize: '18px', margin: '8px 0' }}><strong>Tick:</strong> {gameState.currentTick}</p>
                  <p style={{ fontSize: '18px', margin: '8px 0' }}><strong>Players:</strong> {gameState.players.length}</p>
                </StickyNote>

                <StickyNote color="pink" style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, fontSize: '24px' }}>Players</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gameState.players.map((player: any) => (
                      <div 
                        key={player.id}
                        style={{ 
                          padding: '8px', 
                          background: player.id === playerId ? 'rgba(255,255,255,0.5)' : 'transparent',
                          border: player.id === playerId ? '2px dashed #1a1a1a' : 'none',
                          borderRadius: '4px',
                          fontSize: '18px'
                        }}
                      >
                        <span style={{ 
                          display: 'inline-block', 
                          width: '20px', 
                          height: '20px', 
                          backgroundColor: player.color,
                          marginRight: '8px',
                          border: '2px solid #1a1a1a',
                          verticalAlign: 'middle',
                          borderRadius: '2px'
                        }}></span>
                        <strong>{player.username}</strong>
                        {player.id === playerId && ' (You)'}
                      </div>
                    ))}
                  </div>
                </StickyNote>

                {gameState.unitGroups && gameState.unitGroups.length > 0 && (
                  <StickyNote color="yellow">
                    <h3 style={{ marginTop: 0, fontSize: '24px' }}>In Transit ({gameState.unitGroups.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {gameState.unitGroups.map((group: any) => {
                        const owner = gameState.players.find((p: any) => p.id === group.ownerId);
                        
                        return (
                          <div 
                            key={group.id}
                            style={{ 
                              padding: '10px', 
                              border: `2px solid ${owner?.color || '#999'}`,
                              borderRadius: '4px',
                              backgroundColor: `${owner?.color || '#999'}22`,
                              fontSize: '16px'
                            }}
                          >
                            <div style={{ marginBottom: '6px' }}>
                              <strong style={{ fontSize: '18px' }}>{group.unitCount}</strong> units
                            </div>
                            <div style={{ color: '#666' }}>
                              {(group.progress * 100).toFixed(0)}% complete
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </StickyNote>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <StickyNote 
            color="yellow" 
            style={{
              textAlign: 'center',
              maxWidth: '500px',
              border: `4px solid ${winner?.color || '#ffd700'}`,
              transform: 'rotate(0deg) scale(1.1)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.4)'
            }}
          >
            <h2 style={{ 
              marginTop: 0, 
              fontSize: '48px',
              color: winner?.color || '#1a1a1a',
              fontFamily: "'Caveat', cursive"
            }}>
              🎉 Game Over! 🎉
            </h2>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold',
              margin: '20px 0',
              color: '#1a1a1a'
            }}>
              {winner?.username || 'Unknown'} Wins!
            </div>
            <div style={{ 
              fontSize: '22px', 
              color: '#666',
              marginBottom: '20px'
            }}>
              {gameOver.reason}
            </div>
            {winner?.id === playerId && (
              <div style={{ 
                fontSize: '28px', 
                color: '#4caf50',
                fontWeight: 'bold',
                marginTop: '10px'
              }}>
                Victory is yours! 🏆
              </div>
            )}
            {winner?.id !== playerId && (
              <div style={{ 
                fontSize: '24px', 
                color: '#666',
                marginTop: '10px'
              }}>
                Better luck next time!
              </div>
            )}
            <button
              onClick={handlePlayAgain}
              style={{
                marginTop: '30px',
                padding: '16px 32px',
                fontSize: '24px',
                fontFamily: "'Caveat', 'Patrick Hand', cursive",
                backgroundColor: winner?.color || '#4caf50',
                color: '#fff',
                border: '3px solid #1a1a1a',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.3)'
              }}
            >
              Play Again
            </button>
          </StickyNote>
        </div>
      )}

      {/* Page Flip Animation */}
      {showPageFlip && (
        <PageFlip onComplete={handlePageFlipComplete} />
      )}
    </div>
  );
}

export default App;

