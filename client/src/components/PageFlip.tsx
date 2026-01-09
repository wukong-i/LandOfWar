import React from 'react';

interface PageFlipProps {
  onComplete: () => void;
}

export const PageFlip: React.FC<PageFlipProps> = ({ onComplete }) => {
  React.useEffect(() => {
    // Trigger reload/next action after animation completes
    const timer = setTimeout(() => {
      onComplete();
    }, 1500); // Match animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="page-flip-container">
      <div style={{
        padding: '40px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        textAlign: 'center',
        border: '2px solid #e0e0e0'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          📖 Next Match
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Flipping to a new page...
        </p>
      </div>
    </div>
  );
};
