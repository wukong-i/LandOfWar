import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { GameState, Base, UnitGroup } from '@flavortown/shared';
import { NotebookTheme, generateSketchyCircle } from '../utils/theme';

interface GameCanvasProps {
  gameState: GameState | null;
  playerId: string | null;
  onBaseClick: (baseId: string) => void;
  selectedBase: string | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  playerId, 
  onBaseClick,
  selectedBase 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const basesContainerRef = useRef<PIXI.Container | null>(null);
  const unitGroupsContainerRef = useRef<PIXI.Container | null>(null);

  // Initialize Pixi
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0xFFFEF0, // Cream paper color
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create background (notebook paper)
    const background = new PIXI.Graphics();
    drawNotebookPaper(background, 800, 600);
    app.stage.addChild(background);

    // Create containers for game objects
    const basesContainer = new PIXI.Container();
    const unitGroupsContainer = new PIXI.Container();
    
    app.stage.addChild(unitGroupsContainer);
    app.stage.addChild(basesContainer);
    
    basesContainerRef.current = basesContainer;
    unitGroupsContainerRef.current = unitGroupsContainer;

    // Cleanup
    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  // Update rendering when game state changes
  useEffect(() => {
    if (!gameState || !basesContainerRef.current || !unitGroupsContainerRef.current) return;

    // Clear previous renders
    basesContainerRef.current.removeChildren();
    unitGroupsContainerRef.current.removeChildren();

    // Draw bases
    gameState.bases.forEach((base: Base) => {
      const owner = base.ownerId ? gameState.players.find((p: any) => p.id === base.ownerId) : null;
      const isSelected = selectedBase === base.id;
      const isPlayerOwned = base.ownerId === playerId;
      
      drawBase(basesContainerRef.current!, base, owner?.color || '#999999', isSelected, isPlayerOwned, onBaseClick);
    });

    // Draw unit groups
    gameState.unitGroups.forEach((group: UnitGroup) => {
      const fromBase = gameState.bases.find((b: Base) => b.id === group.fromBaseId);
      const toBase = gameState.bases.find((b: Base) => b.id === group.toBaseId);
      const owner = gameState.players.find((p: any) => p.id === group.ownerId);
      
      if (fromBase && toBase) {
        drawUnitGroup(unitGroupsContainerRef.current!, group, fromBase, toBase, owner?.color || '#999999');
      }
    });
  }, [gameState, selectedBase, playerId, onBaseClick]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        border: '2px solid #333', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }} 
    />
  );
};

// Draw notebook paper background
function drawNotebookPaper(graphics: PIXI.Graphics, width: number, height: number): void {
  // Cream/off-white background
  graphics.beginFill(0xFFFEF0);
  graphics.drawRect(0, 0, width, height);
  graphics.endFill();

  // Add subtle paper texture with dots
  graphics.lineStyle(0);
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = Math.random() * 0.05;
    graphics.beginFill(0xD4C5B0, alpha);
    graphics.drawCircle(x, y, 1);
    graphics.endFill();
  }

  // Horizontal ruled lines (slightly wobbly)
  graphics.lineStyle(1, 0xD4E4F7, 0.7);
  for (let y = 30; y < height; y += 30) {
    graphics.moveTo(0, y);
    // Draw wobbly line
    for (let x = 0; x <= width; x += 20) {
      const wobble = (Math.random() - 0.5) * 0.5;
      graphics.lineTo(x, y + wobble);
    }
  }

  // Red margin line (slightly hand-drawn)
  graphics.lineStyle(2, 0xFF6B6B, 0.9);
  const marginX = 60;
  graphics.moveTo(marginX, 0);
  for (let y = 0; y <= height; y += 20) {
    const wobble = (Math.random() - 0.5) * 1;
    graphics.lineTo(marginX + wobble, y);
  }

  // Coffee stain (optional detail)
  graphics.beginFill(0xD4C5B0, 0.1);
  graphics.drawCircle(680, 80, 25);
  graphics.endFill();
}

// Draw a base with hand-drawn/doodled style
function drawBase(
  container: PIXI.Container, 
  base: Base, 
  color: string, 
  isSelected: boolean,
  _isPlayerOwned: boolean,
  onBaseClick: (baseId: string) => void
): void {
  const graphics = new PIXI.Graphics();
  
  // Parse color
  const fillColor = parseInt(color.replace('#', ''), 16);
  
  // Draw hand-drawn circle (sketchy style)
  const sketchPoints = generateSketchyCircle(base.x, base.y, 30, 36, 3);
  
  graphics.lineStyle(2, 0x1a1a1a, 0.8); // Ink black outline
  graphics.beginFill(fillColor, base.ownerId ? 0.4 : 0.15);
  
  // Draw the sketchy path
  graphics.moveTo(sketchPoints[0].x, sketchPoints[0].y);
  for (let i = 1; i < sketchPoints.length; i++) {
    graphics.lineTo(sketchPoints[i].x, sketchPoints[i].y);
  }
  graphics.closePath();
  graphics.endFill();

  // Add a second sketchy outline for more hand-drawn effect
  const sketchPoints2 = generateSketchyCircle(base.x, base.y, 30, 36, 2);
  graphics.lineStyle(1.5, 0x1a1a1a, 0.4);
  graphics.moveTo(sketchPoints2[0].x, sketchPoints2[0].y);
  for (let i = 1; i < sketchPoints2.length; i++) {
    graphics.lineTo(sketchPoints2[i].x, sketchPoints2[i].y);
  }
  graphics.closePath();

  // Selection indicator (highlighter effect)
  if (isSelected) {
    graphics.lineStyle(0);
    graphics.beginFill(0xFFF9C4, 0.5); // Yellow highlight
    const highlightPoints = generateSketchyCircle(base.x, base.y, 38, 32, 4);
    graphics.moveTo(highlightPoints[0].x, highlightPoints[0].y);
    for (let i = 1; i < highlightPoints.length; i++) {
      graphics.lineTo(highlightPoints[i].x, highlightPoints[i].y);
    }
    graphics.closePath();
    graphics.endFill();
  }

  // Make all bases interactive
  graphics.interactive = true;
  graphics.cursor = 'pointer';
  graphics.on('pointerdown', () => onBaseClick(base.id));

  container.addChild(graphics);

  // Draw unit count with handwritten style
  const text = new PIXI.Text(base.unitCount.toString(), {
    fontFamily: NotebookTheme.fonts.handwritten,
    fontSize: 22,
    fontWeight: 'bold',
    fill: 0x1a1a1a, // Ink black
  });
  text.anchor.set(0.5);
  text.x = base.x;
  text.y = base.y;
  container.addChild(text);

  // Draw base ID label with pencil style
  const label = new PIXI.Text(base.id, {
    fontFamily: NotebookTheme.fonts.print,
    fontSize: 9,
    fill: 0x666666, // Pencil gray
  });
  label.anchor.set(0.5);
  label.x = base.x;
  label.y = base.y + 45;
  container.addChild(label);

  // Add little doodle decoration for owned bases
  if (base.ownerId) {
    const doodleGraphics = new PIXI.Graphics();
    doodleGraphics.lineStyle(1, fillColor, 0.6);
    
    // Draw little stars around owned bases
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const dist = 42 + Math.random() * 5;
      const sx = base.x + Math.cos(angle) * dist;
      const sy = base.y + Math.sin(angle) * dist;
      
      // Draw tiny star
      for (let j = 0; j < 4; j++) {
        const starAngle = (j / 4) * Math.PI * 2;
        const x1 = sx + Math.cos(starAngle) * 3;
        const y1 = sy + Math.sin(starAngle) * 3;
        const x2 = sx + Math.cos(starAngle + Math.PI) * 3;
        const y2 = sy + Math.sin(starAngle + Math.PI) * 3;
        doodleGraphics.moveTo(x1, y1);
        doodleGraphics.lineTo(x2, y2);
      }
    }
    
    container.addChild(doodleGraphics);
  }
}

// Draw a moving unit group (ink dots with trail)
function drawUnitGroup(
  container: PIXI.Container,
  group: UnitGroup,
  fromBase: Base,
  toBase: Base,
  color: string
): void {
  // Calculate position based on progress
  const x = fromBase.x + (toBase.x - fromBase.x) * group.progress;
  const y = fromBase.y + (toBase.y - fromBase.y) * group.progress;

  const graphics = new PIXI.Graphics();
  
  // Parse color
  const fillColor = parseInt(color.replace('#', ''), 16);
  
  // Draw dotted trail behind the unit group
  graphics.lineStyle(2, fillColor, 0.3);
  for (let i = 0.1; i < group.progress; i += 0.05) {
    const trailX = fromBase.x + (toBase.x - fromBase.x) * i;
    const trailY = fromBase.y + (toBase.y - fromBase.y) * i;
    graphics.drawCircle(trailX, trailY, 1);
  }

  // Draw main unit group as sketchy circle
  const sketchPoints = generateSketchyCircle(x, y, 10, 16, 1.5);
  graphics.lineStyle(2, 0x1a1a1a, 0.8);
  graphics.beginFill(fillColor, 1);
  graphics.moveTo(sketchPoints[0].x, sketchPoints[0].y);
  for (let i = 1; i < sketchPoints.length; i++) {
    graphics.lineTo(sketchPoints[i].x, sketchPoints[i].y);
  }
  graphics.closePath();
  graphics.endFill();

  // Add movement lines (speed lines)
  graphics.lineStyle(1, fillColor, 0.5);
  const angle = Math.atan2(toBase.y - fromBase.y, toBase.x - fromBase.x);
  for (let i = 0; i < 3; i++) {
    const offsetY = (i - 1) * 4;
    const startX = x - Math.cos(angle) * (12 + i * 3);
    const startY = y - Math.sin(angle) * (12 + i * 3) + offsetY;
    const endX = x - Math.cos(angle) * (5 + i * 2);
    const endY = y - Math.sin(angle) * (5 + i * 2) + offsetY;
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
  }

  container.addChild(graphics);

  // Draw unit count with handwritten font
  const text = new PIXI.Text(group.unitCount.toString(), {
    fontFamily: NotebookTheme.fonts.handwritten,
    fontSize: 14,
    fontWeight: 'bold',
    fill: 0xffffff,
    stroke: 0x1a1a1a,
    strokeThickness: 2,
  });
  text.anchor.set(0.5);
  text.x = x;
  text.y = y;
  container.addChild(text);
}
