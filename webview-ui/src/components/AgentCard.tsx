import React, { useEffect, useState } from 'react';
import { Agent, getAgentLevelInfo } from '../types';
import { useOfficeStore } from '../store/officeStore';
import { i18n } from '../i18n';
import { CHARACTER_PALETTES } from '../engine/CharacterSprites';

function MiniAvatar({ paletteIndex }: { paletteIndex: number }) {
  return (
    <div style={{ width: '28px', height: '28px', overflow: 'hidden', display: 'flex', justifyContent: 'center', backgroundColor: '#18181b', borderRadius: '4px', position: 'relative' }}>
      <img 
        src={`game_assets/characters/char_${paletteIndex % 6}.png`} 
        style={{ 
          position: 'absolute', 
          top: '-4px', // foca no rosto (o sprite tem 16x32)
          left: '6px', // rosto centralizado na primeira coluna (idle down)
          width: '112px', // 7 colunas de 16 = 112px
          height: '96px', // 3 linhas de 32 = 96px
          imageRendering: 'pixelated'
        }} 
        alt="Avatar" 
      />
    </div>
  );
}

function Sparkline({ status }: { status: string }) {
  // Gera uma sparkline falsa baseada no tempo, mas se movendo
  const [bars, setBars] = useState<number[]>(Array(10).fill(2));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => {
        const next = [...prev.slice(1)];
        let val = 2;
        if (status === 'typing' || status === 'reading' || status === 'thinking') {
          val = Math.random() * 8 + 4; // alta atividade
        } else if (status === 'waiting') {
          val = 0; // sem atividade
        }
        next.push(val);
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '16px', gap: '2px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: '3px', height: `${h}px`, backgroundColor: '#3b82f6', borderRadius: '1px', opacity: 0.2 + (i / 10) * 0.8 }} />
      ))}
    </div>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  const { locale } = useOfficeStore();
  const t = i18n[locale];
  const [activeTime, setActiveTime] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - agent.activeSince) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setActiveTime(`${m}m ${s}s`);
      
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [agent.activeSince]);

  let statusColor = '#22c55e'; // green = idle/done
  if (agent.status === 'thinking' || agent.status === 'reading' || agent.status === 'typing') statusColor = '#3b82f6'; // blue
  if (agent.status === 'waiting') statusColor = '#eab308'; // yellow

  const isWorking = agent.status === 'typing' || agent.status === 'reading' || agent.status === 'thinking';
  
  const paletteIndex = agent.characterIndex % CHARACTER_PALETTES.length;

  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', fontSize: '0.9em', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        
        <div style={{ backgroundColor: '#27272a', borderRadius: '6px', padding: '2px', border: `1px solid ${statusColor}40` }}>
          <MiniAvatar paletteIndex={paletteIndex} />
        </div>

        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexGrow: 1 }}>
              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#e4e4e7' }}>{agent.name}</strong>
              <span style={{ 
                fontSize: '0.65em', padding: '1px 5px', borderRadius: '4px', 
                backgroundColor: `${getAgentLevelInfo(agent.toolCallCount || 0, locale).color}22`, 
                color: getAgentLevelInfo(agent.toolCallCount || 0, locale).color, 
                border: `1px solid ${getAgentLevelInfo(agent.toolCallCount || 0, locale).color}44`, 
                fontWeight: 'bold', whiteSpace: 'nowrap'
              }}>
                {getAgentLevelInfo(agent.toolCallCount || 0, locale).title}
              </span>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}`, flexShrink: 0 }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85em' }}>
            <span style={{ color: statusColor, fontWeight: 600 }}>{t.status[agent.status]}{isWorking ? dots : ''}</span>
            <span style={{ color: '#52525b' }}>•</span>
            <span style={{ color: '#a1a1aa' }}>{agent.provider}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '6px 8px', backgroundColor: '#0f0f12', borderRadius: '6px', border: '1px solid #27272a' }}>
        <div style={{ color: '#d4d4d8', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, fontFamily: 'monospace' }}>
          {agent.currentTool ? `[🔧 ${agent.currentTool}]` : (agent.lastActivity || 'Idle')}
        </div>
        <div style={{ marginLeft: '8px' }}>
          <Sparkline status={agent.status} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#71717a', borderTop: '1px solid #27272a', paddingTop: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#a1a1aa' }}>⏱</span> {activeTime}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#a1a1aa' }}>⚡</span> {agent.toolCallCount} {t.toolCalls}
        </span>
      </div>
    </div>
  );
}
