import type { Agent } from '../types';
import { TileMapRenderer } from './OfficeBackground';

export class Renderer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private tileMapRenderer: TileMapRenderer;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.tileMapRenderer = new TileMapRenderer();
  }

  public draw(
    canvas: HTMLCanvasElement,
    agents: Agent[],
    desks: number,
    zoom: number,
    offsetX: number,
    theme: string,
    panX: number,
    panY: number
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (
      this.offscreenCanvas.width !== canvasWidth ||
      this.offscreenCanvas.height !== canvasHeight
    ) {
      this.offscreenCanvas.width = canvasWidth;
      this.offscreenCanvas.height = canvasHeight;
    }

    // Desativa anti-aliasing no offscreen
    this.offscreenCtx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    // Draw the top-down map to offscreen
    this.tileMapRenderer.draw(this.offscreenCtx, canvasWidth, canvasHeight, zoom, agents, theme, panX, panY);

    // Copia pra tela final
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
}
