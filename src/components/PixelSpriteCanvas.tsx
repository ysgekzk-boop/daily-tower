import { useEffect, useRef } from 'react';
import { resolveSpriteData } from '../extensible/sprites/spriteRegistry';

interface PixelSpriteCanvasProps {
  spriteId: string;
  paletteId?: string;
  scale?: number;
  flipHorizontal?: boolean;
  className?: string;
}

export function PixelSpriteCanvas({
  spriteId,
  paletteId,
  scale = 10,
  flipHorizontal = false,
  className = '',
}: PixelSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { grid, palette } = resolveSpriteData(spriteId, paletteId);
  const rows = grid.length;
  const cols = grid[0]?.length ?? 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cols * scale, rows * scale);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const srcCol = flipHorizontal ? cols - 1 - c : c;
        const colorIdx = grid[r][srcCol];
        if (colorIdx === 0) continue;
        const fill = palette.colors[colorIdx] ?? '#ffffff';
        ctx.fillStyle = fill;
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }
  }, [grid, palette, rows, cols, scale, flipHorizontal]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * scale}
      height={rows * scale}
      aria-hidden="true"
      className={`block [image-rendering:pixelated] ${className}`}
    />
  );
}
