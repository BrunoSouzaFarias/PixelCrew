import React from 'react';
import { useOfficeStore } from '../store/officeStore';

export function DecorationPanel() {
  const { isDecorationMode, selectedFurnitureId, addFurniture, rotateFurniture, deleteFurniture, setDecorationMode } = useOfficeStore();

  if (!isDecorationMode) return null;

  const catalog = [
    { type: 'PLANT', label: 'Planta (Vaso) 🪴' },
    { type: 'DESK_FRONT', label: 'Mesa de Dev 🖥️' },
    { type: 'SOFA_FRONT', label: 'Sofá Comum 🛋️' },
    { type: 'COFFEE_TABLE', label: 'Mesa de Centro ☕' },
    { type: 'DOUBLE_BOOKSHELF', label: 'Estante de Livros 📚' },
    { type: 'BIN', label: 'Lixeira 🗑️' }
  ];

  const handleAddItem = (type: string) => {
    // Adiciona no centro do mapa (aproximadamente col: 10, row: 15)
    addFurniture(type, 10, 15);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '20px',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      border: '1px solid #3f3f46',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      width: '280px',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      color: '#f4f4f5',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#60a5fa' }}>
          🛠️ Modo Decoração
        </h4>
        <button 
          onClick={() => setDecorationMode(false)}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '2px 8px'
          }}
        >
          Sair
        </button>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.4' }}>
        💡 <b>Instruções:</b> Clique e arraste móveis no canvas para movê-los. Clique em um móvel para selecioná-lo e rotacionar ou deletar.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: '#e4e4e7', fontWeight: 'bold' }}>Adicionar Móveis:</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {catalog.map(item => (
            <button
              key={item.type}
              onClick={() => handleAddItem(item.type)}
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#e4e4e7',
                padding: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {selectedFurnitureId && (
        <div style={{
          marginTop: '8px',
          borderTop: '1px solid #27272a',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>Móvel Selecionado:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => rotateFurniture(selectedFurnitureId)}
              style={{
                flex: 1,
                backgroundColor: '#1e3a8a',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                color: '#3b82f6',
                padding: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Rotacionar
            </button>
            <button
              onClick={() => deleteFurniture(selectedFurnitureId)}
              style={{
                flex: 1,
                backgroundColor: '#991b1b',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fee2e2',
                padding: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🗑️ Deletar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
