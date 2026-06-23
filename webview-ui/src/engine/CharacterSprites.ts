import type { AgentStatus } from '../types';
import { spriteEngine, Palette } from './SpriteEngine';

export const CHARACTER_PALETTES: Palette[] = [
  { skin: '#F5C5A3', skinShadow: '#D29C7C', hair: '#7B3F00', hairHighlight: '#A35D15', hairDark: '#4A2500', shirt: '#FFFFFF', shirtShadow: '#D0D0D0', pants: '#2D5BE3', pantsShadow: '#1A3B9E' },
  { skin: '#F5C5A3', skinShadow: '#D29C7C', hair: '#D4A017', hairHighlight: '#F2C649', hairDark: '#9C7205', shirt: '#1A1A2E', shirtShadow: '#0A0A14', pants: '#4A4A4A', pantsShadow: '#2E2E2E' },
  { skin: '#8B5E3C', skinShadow: '#633F23', hair: '#1A0A00', hairHighlight: '#3B1A00', hairDark: '#0A0400', shirt: '#FF6600', shirtShadow: '#C24A00', pants: '#333333', pantsShadow: '#1A1A1A' },
  { skin: '#F5C5A3', skinShadow: '#D29C7C', hair: '#1A1A1A', hairHighlight: '#4A4A4A', hairDark: '#0A0A0A', shirt: '#DC143C', shirtShadow: '#990022', pants: '#1A1A1A', pantsShadow: '#0A0A0A' },
  { skin: '#F5C5A3', skinShadow: '#D29C7C', hair: '#C0C0C0', hairHighlight: '#E0E0E0', hairDark: '#808080', shirt: '#004B8D', shirtShadow: '#00305C', pants: '#1A1A1A', pantsShadow: '#0A0A0A' },
  { skin: '#F5D5B3', skinShadow: '#D2AC8B', hair: '#7B3F00', hairHighlight: '#A35D15', hairDark: '#4A2500', shirt: '#F0F0F0', shirtShadow: '#C0C0C0', pants: '#8B8B8B', pantsShadow: '#5C5C5C' },
];

export function getFrameCount(status: AgentStatus): number {
  switch (status) {
    case 'idle': return 4; 
    case 'walking': return 4;
    case 'typing': return 3;
    case 'reading': return 2;
    case 'done': return 4;
    default: return 1;
  }
}

export function getAnimationFPS(status: AgentStatus): number {
  switch (status) {
    case 'idle': return 2;
    case 'walking': return 8;
    case 'typing': return 6;
    case 'reading': return 2;
    case 'done': return 8;
    default: return 1;
  }
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  characterIndex: number,
  status: AgentStatus,
  frame: number,
  scale: number
) {
  const paletteIndex = characterIndex % CHARACTER_PALETTES.length;
  ctx.imageSmoothingEnabled = false;

  let spriteFrame = 'idle';
  let isBlinking = false;
  let hasDust = false;

  if (status === 'idle') {
    if (frame === 3) isBlinking = true;
  } else if (status === 'walking') {
    if (frame === 1) { spriteFrame = 'walk1'; hasDust = true; }
    else if (frame === 3) { spriteFrame = 'walk2'; hasDust = true; }
  } else if (status === 'typing') {
    if (frame === 0) { spriteFrame = 'type1'; }
    else if (frame === 1) { spriteFrame = 'type2'; }
    else { spriteFrame = 'type1'; }
  }

  const canvas = spriteEngine.getSprite(paletteIndex, spriteFrame);
  if (canvas) {
    const w = 16 * scale;
    const h = 24 * scale;
    
    let bounceY = 0;
    if (status === 'idle' && (frame === 1 || frame === 3)) bounceY = 1 * scale;
    if (status === 'walking' && (frame === 0 || frame === 2)) bounceY = -1 * scale;
    if (status === 'reading' && frame === 1) bounceY = 1 * scale;
    if (status === 'done' && (frame === 1 || frame === 2)) bounceY = -3 * scale;
    if (status === 'typing' && frame === 1) bounceY = 1 * scale;

    ctx.drawImage(canvas, x - (8 * scale), y + bounceY, w, h);

    // Blinking logic (override pre-rendered eyes)
    if (isBlinking) {
       ctx.save();
       ctx.translate(x, y + bounceY);
       ctx.scale(scale, scale);
       ctx.fillStyle = CHARACTER_PALETTES[paletteIndex].skinShadow;
       // Eyes are around row 8 and columns 6-7 (left) and 10-11 (right) relative to top-left of 16x24
       // Center is 8. So left is -2 to 0, right is 2 to 4.
       ctx.fillRect(-2, 7, 2, 1);
       ctx.fillRect(2, 7, 2, 1);
       ctx.restore();
    }

    // Draw Dust particles if walking
    if (hasDust) {
      ctx.save();
      ctx.translate(x, y + bounceY);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(-6 + Math.random()*2, 22 - Math.random()*2, 2, 2);
      ctx.fillRect(4 + Math.random()*2, 22 - Math.random()*2, 2, 2);
      ctx.restore();
    }

    // Monitor Glow
    if (status === 'typing' || status === 'reading' || status === 'thinking') {
      ctx.save();
      ctx.translate(x, y + bounceY);
      ctx.scale(scale, scale);
      const glowPulse = 0.1 + Math.sin(Date.now() / 200) * 0.05;
      ctx.fillStyle = `rgba(56, 189, 248, ${glowPulse})`;
      ctx.beginPath();
      ctx.ellipse(0, 12, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
