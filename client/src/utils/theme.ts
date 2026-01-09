// Notebook theme constants and utilities

export const NotebookTheme = {
  colors: {
    paper: '#FFFEF0',
    lineBlue: '#D4E4F7',
    marginRed: '#FF6B6B',
    inkBlack: '#1a1a1a',
    pencilGray: '#666666',
    highlightYellow: '#FFF9C4',
    stickyYellow: '#FFEB3B',
    stickyPink: '#FFB6C1',
    stickyGreen: '#C8E6C9',
    stickyBlue: '#B3E5FC',
  },
  
  fonts: {
    handwritten: "'Caveat', 'Patrick Hand', 'Indie Flower', cursive, sans-serif",
    print: "'Courier New', 'Courier', monospace",
  },
  
  shadows: {
    note: '2px 2px 8px rgba(0, 0, 0, 0.15)',
    lifted: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
};

// Hand-drawn circle points generator (for sketchy bases)
export function generateSketchyCircle(
  x: number, 
  y: number, 
  radius: number, 
  segments: number = 32,
  wobble: number = 2
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobbleAmount = (Math.random() - 0.5) * wobble;
    const r = radius + wobbleAmount;
    
    points.push({
      x: x + Math.cos(angle) * r,
      y: y + Math.sin(angle) * r,
    });
  }
  
  return points;
}

// Jitter number for hand-drawn effect
export function jitter(value: number, amount: number = 1): number {
  return value + (Math.random() - 0.5) * amount;
}
