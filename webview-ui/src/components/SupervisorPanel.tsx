import React from 'react';
import { useOfficeStore } from '../store/officeStore';
import { i18n } from '../i18n';
import { AgentCard } from './AgentCard';
import { vscode } from '../vscodeApi';

export function SupervisorPanel() {
  const { agents, locale, swapCharacter, customNames, setCustomName } = useOfficeStore();
  const t = i18n[locale];
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const agentsList = Object.values(agents);

  return (
    <div style={{ width: '280px', backgroundColor: '#09090b', borderLeft: '1px solid #004B8D', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #27272a', fontWeight: 'bold' }}>
        {t.supervisorPanel}
      </div>
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {agentsList.length === 0 ? (
          <div style={{ color: '#a1a1aa', fontSize: '0.9em', textAlign: 'center', marginTop: '20px' }}>
            {t.noAgents}
          </div>
        ) : (
          agentsList.map(agent => {
            const displayName = customNames[agent.id] || agent.name;
            const isEditing = editingId === agent.id;
            return (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: '8px' }}>
                <AgentCard agent={{...agent, name: displayName}} />
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (isEditing) {
                    setCustomName(agent.id, editValue);
                    setEditingId(null);
                  } else {
                    setEditValue(displayName);
                    setEditingId(agent.id);
                  }
                }}
                title={isEditing ? "Salvar" : "Renomear (Criar Squad)"}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '12px' }}
              >
                {isEditing ? '✅' : '✏️'}
              </button>
              {isEditing && (
                <input 
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCustomName(agent.id, editValue);
                      setEditingId(null);
                    }
                  }}
                  style={{
                    position: 'absolute', right: '60px', width: '100px',
                    background: '#27272a', color: 'white', border: '1px solid #3f3f46',
                    borderRadius: '4px', padding: '2px 4px', fontSize: '11px'
                  }}
                />
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); swapCharacter(agent.id); }}
                title="Trocar Avatar"
                style={{ 
                  background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '12px', padding: 0
                }}
              >
                🔄
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  console.log('Click on remove agent:', agent.id);
                  // Remove locally first for instant visual feedback
                  useOfficeStore.getState().removeAgent(agent.id);
                  try {
                    vscode.postMessage({ type: 'REMOVE_AGENT', agentId: agent.id });
                  } catch (err) {
                    console.error('Error posting REMOVE_AGENT message:', err);
                  }
                }}
                title="Remover Agente do Escritório"
                style={{ 
                  background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '12px', padding: 0, color: '#ef4444'
                }}
              >
                ❌
              </button>
            </div>
            );
          })
        )}
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid #27272a', backgroundColor: '#0f0f12', fontSize: '0.85em', color: '#a1a1aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Total Agents:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{agentsList.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Tool Calls:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>
            {agentsList.reduce((acc, curr) => acc + curr.toolCallCount, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
