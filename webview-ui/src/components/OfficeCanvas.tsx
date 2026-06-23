import React, { useEffect, useRef } from 'react';
import { useOfficeStore } from '../store/officeStore';
import { GameLoop } from '../engine/GameLoop';
import { Renderer } from '../engine/Renderer';
import { vscode } from '../vscodeApi';

export function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { agents, desks, zoom, offsetX } = useOfficeStore();

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
  }, []); // Intentionally empty dependency array, loop reads from getState()

  const isDragging = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    lastPan.current = { x: e.clientX, y: e.clientY };
    
    const state = useOfficeStore.getState();
    state.setPan(state.panX + dx, state.panY + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
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
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' }} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />
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
