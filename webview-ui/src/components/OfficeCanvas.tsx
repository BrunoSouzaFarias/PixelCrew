import React, { useEffect, useRef, useState } from 'react';
import { useOfficeStore } from '../store/officeStore';
import { GameLoop } from '../engine/GameLoop';
import { Renderer } from '../engine/Renderer';
import { vscode } from '../vscodeApi';
import { SpeechBubbleModal } from './SpeechBubbleModal';
import { DecorationPanel } from './DecorationPanel';

export function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  
  const { agents, desks, zoom, offsetX, isDecorationMode } = useOfficeStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Resize canvas to fill container
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    resizeObserver.observe(container);

    const gameLoop = new GameLoop();
    const renderer = new Renderer();
    rendererRef.current = renderer;
    let currentTheme = 'default-layout-1';

    gameLoop.start(() => {
      const state = useOfficeStore.getState();
      
      // Reload map if theme changes
      if (state.theme !== currentTheme) {
        currentTheme = state.theme;
        renderer.tileMapRenderer.loadMap(currentTheme + '.json');
      }

      const agentsList = Object.values(state.agents).map(a => ({
        ...a,
        name: state.customNames[a.id] || a.name
      }));
      renderer.draw(canvas, agentsList, state.desks, state.zoom, state.offsetX, state.theme, state.panX, state.panY);
    });

    return () => {
      resizeObserver.disconnect();
      gameLoop.stop();
    };
  }, []);

  const isDragging = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const draggingFurnitureId = useRef<string | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    lastPan.current = { x: e.clientX, y: e.clientY };

    const state = useOfficeStore.getState();

    if (state.isDecorationMode) {
      // Verifica se clicou em algum móvel para arrastar
      const clickedFurnId = rendererRef.current?.tileMapRenderer.getFurnitureAtCoordinates(
        canvas.width,
        canvas.height,
        state.zoom,
        mouseX,
        mouseY,
        state.panX,
        state.panY
      );

      if (clickedFurnId) {
        state.setSelectedFurnitureId(clickedFurnId);
        draggingFurnitureId.current = clickedFurnId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        isDragging.current = false;
        return;
      } else {
        state.setSelectedFurnitureId(null);
      }
    }

    // Comportamento normal de pan (arrastar a tela)
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = useOfficeStore.getState();

    if (state.isDecorationMode && draggingFurnitureId.current) {
      // Arrastar móvel no grid
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const TILE_SIZE = 16;
      const s = TILE_SIZE * state.zoom;
      const cols = state.mapData?.cols || 21;
      const rows = state.mapData?.rows || 22;
      const mapW = cols * s;
      const mapH = rows * s;
      const offsetX = Math.floor((canvas.width - mapW) / 2 + state.panX);
      const offsetY = Math.floor((canvas.height - mapH) / 2 + state.panY);

      const col = Math.floor((mouseX - offsetX) / s);
      const row = Math.floor((mouseY - offsetY) / s);

      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        // Checa se o tile é chão válido
        const idx = row * cols + col;
        const tileType = state.mapData?.tiles?.[idx];
        if (tileType !== undefined && tileType !== 255) {
          // Evita sobreposição de móveis na mesma coordenada
          const isOccupied = (state.mapData.furniture || []).some((f: any) => 
            f.uid !== draggingFurnitureId.current && f.col === col && f.row === row
          );
          if (!isOccupied) {
            state.moveFurniture(draggingFurnitureId.current, col, row);
          }
        }
      }
      return;
    }

    if (!isDragging.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    lastPan.current = { x: e.clientX, y: e.clientY };
    
    state.setPan(state.panX + dx, state.panY + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggingFurnitureId.current) {
      draggingFurnitureId.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }

    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Verifica se foi um clique rápido
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const state = useOfficeStore.getState();

      // Detecção de clique em agentes
      const clickedAgentId = rendererRef.current?.tileMapRenderer.getAgentAtCoordinates(
        canvas.width,
        canvas.height,
        state.zoom,
        mouseX,
        mouseY,
        state.panX,
        state.panY
      );

      if (clickedAgentId) {
        setSelectedAgentId(clickedAgentId);
      } else {
        // Se clicar no chão/vazio, fecha modal de falas
        setSelectedAgentId(null);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const state = useOfficeStore.getState();
    const newZoom = Math.min(Math.max(1, state.zoom - Math.sign(e.deltaY) * 0.25), 5);
    state.setZoom(newZoom);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 40px)', backgroundColor: '#09090b', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          touchAction: 'none', 
          cursor: isDecorationMode ? 'cell' : (isDragging.current ? 'grabbing' : 'grab') 
        }} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Popovers e Painéis Interativos */}
      {selectedAgentId && (
        <SpeechBubbleModal 
          agentId={selectedAgentId} 
          onClose={() => setSelectedAgentId(null)} 
        />
      )}

      <DecorationPanel />

      {Object.values(agents).length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ 
            backgroundColor: 'rgba(24, 24, 27, 0.95)', 
            padding: '40px', 
            borderRadius: '12px', 
            border: '1px solid #3f3f46',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backdropFilter: 'blur(4px)',
            maxWidth: '500px',
            pointerEvents: 'auto'
          }}>
            <pre style={{ 
              fontFamily: 'monospace', 
              fontSize: '12px', 
              lineHeight: '12px', 
              color: '#3b82f6', 
              textAlign: 'center', 
              marginBottom: '24px',
              textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}>
{`
   _____ _          __  ____            
  |  __ (_)        | | / ___|           
  | |__) |__  _____| || |     _ __ _____      __
  |  ___/ \\ \\/ / _ \\ || |    | '__/ _ \\ \\ /\\ / /
  | |   | |>  <  __/ || |____| | |  __/\\ V  V / 
  |_|   |_/_/\\_\\___|_(_)_____|_|  \\___| \\_/\\_/  
`}
            </pre>
            <h2 style={{ color: '#e4e4e7', marginBottom: '8px', marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Seu Escritório Virtual</h2>
            <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '32px', lineHeight: '1.5' }}>
              Nenhum agente ativo no momento. Inicie uma nova tarefa ou recrute um agente para começar a trabalhar no seu código.
            </p>
            <button 
              onClick={() => vscode.postMessage({ type: 'SPAWN_AGENT' } as any)}
              style={{ 
                background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)', 
                border: '1px solid #1e40af', 
                color: 'white', 
                padding: '12px 24px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)', 
                transition: 'all 0.2s' 
              }}
            >
              ＋ Recrutar Agente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
