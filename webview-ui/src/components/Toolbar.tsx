import React from 'react';
import { useOfficeStore } from '../store/officeStore';
import { i18n } from '../i18n';
import { vscode } from '../vscodeApi';

export function Toolbar() {
  const { zoom, setZoom, locale, setLocale, showSupervisorPanel, toggleSupervisorPanel, agents, theme, setTheme, isDecorationMode, setDecorationMode } = useOfficeStore();
  const t = i18n[locale];
  const activeCount = Object.values(agents).length;

  return (
    <div style={{ height: '40px', backgroundColor: '#09090b', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontWeight: 800, color: '#e4e4e7', letterSpacing: '0.5px' }}>PixelCrew</div>
        {activeCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#18181b', padding: '2px 6px', borderRadius: '12px', border: '1px solid #27272a' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: '0.75em', color: '#a1a1aa', fontWeight: 'bold' }}>{activeCount}</span>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', backgroundColor: '#18181b', borderRadius: '6px', border: '1px solid #27272a', overflow: 'hidden' }}>
        {[1, 2, 3].map((z, idx) => (
          <button 
            key={z} 
            onClick={() => setZoom(z)}
            style={{ 
              background: zoom === z ? '#3f3f46' : 'transparent', 
              border: 'none', 
              borderRight: idx < 2 ? '1px solid #27272a' : 'none',
              color: zoom === z ? '#ffffff' : '#a1a1aa', 
              padding: '4px 12px', 
              cursor: 'pointer',
              fontWeight: zoom === z ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {z}x
          </button>
        ))}
      </div>

      <button 
        onClick={() => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR')}
        style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
      >
        {locale.toUpperCase()}
      </button>

      {/* Theme selector */}
      <select 
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          background: 'transparent',
          border: '1px solid #3f3f46',
          color: '#a1a1aa',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        <option value="default-layout-1">Default Layout</option>
        <option value="hacker-basement">Hacker Basement</option>
      </select>

      <button 
        onClick={() => setDecorationMode(!isDecorationMode)}
        style={{
          background: isDecorationMode ? '#2563eb' : '#18181b',
          border: '1px solid #27272a',
          color: isDecorationMode ? '#ffffff' : '#a1a1aa',
          padding: '4px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        🛠️ {locale === 'pt-BR' ? 'Decoração' : 'Decorate'}
      </button>

      <div style={{ flexGrow: 1 }} />

      <button 
        onClick={() => vscode.postMessage({ type: 'SPAWN_AGENT' } as any)}
        style={{ background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)', border: '1px solid #1e40af', color: 'white', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
      >
        ＋ {t.addAgent}
      </button>

      <button 
        onClick={toggleSupervisorPanel}
        style={{ background: showSupervisorPanel ? '#3f3f46' : '#18181b', border: '1px solid #27272a', color: showSupervisorPanel ? '#ffffff' : '#a1a1aa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
      >
        👁 <span style={{ fontWeight: showSupervisorPanel ? 'bold' : 'normal' }}>{t.supervisorPanel}</span>
      </button>
    </div>
  );
}
