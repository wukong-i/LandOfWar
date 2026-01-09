import React from 'react';

interface StickyNoteProps {
  children: React.ReactNode;
  color?: 'yellow' | 'pink' | 'blue' | 'green';
  className?: string;
  style?: React.CSSProperties;
}

const colorMap = {
  yellow: '#FFF9C4',
  pink: '#FFE4E1',
  blue: '#D4E4F7',
  green: '#E8F5E9',
};

export const StickyNote: React.FC<StickyNoteProps> = ({ 
  children, 
  color = 'yellow',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`sticky-note ${className}`}
      style={{
        backgroundColor: colorMap[color],
        padding: '20px',
        borderRadius: '2px',
        boxShadow: '3px 3px 8px rgba(0, 0, 0, 0.15)',
        fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif",
        fontSize: '18px',
        position: 'relative',
        transform: `rotate(${Math.random() * 4 - 2}deg)`,
        ...style,
      }}
    >
      {/* Tape effect at top */}
      <div
        style={{
          position: 'absolute',
          top: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: '2px',
        }}
      />
      {children}
    </div>
  );
};
