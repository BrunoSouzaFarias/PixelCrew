import React, { useState } from 'react';
import { useOfficeStore } from '../store/officeStore';
import { getAgentLevelInfo } from '../types';

interface SpeechBubbleModalProps {
  agentId: string;
  onClose: () => void;
}

export function SpeechBubbleModal({ agentId, onClose }: SpeechBubbleModalProps) {
  const { agents, customNames, sendAgentSpeech } = useOfficeStore();
  const agent = agents[agentId];
  const [text, setText] = useState('');

  if (!agent) return null;

  const agentName = customNames[agent.id] || agent.name;
  const levelInfo = getAgentLevelInfo(agent.toolCallCount || 0);

  const jokes = [
    "Por que o programador odeia a natureza? Porque tem muitos bugs! 🐛",
    "Existem 10 tipos de pessoas no mundo: as que entendem binário e as que não. 💻",
    "Como o programador dorme? 'while (dormindo) { zzz(); }' 😴",
    "Git commit: 'Consertando bug.' Git commit: 'Consertando conserto do bug.' 🤦‍♂️",
    "Programador: um organismo complexo que converte café em código-fonte. ☕",
    "A IA vai substituir os programadores? Não, porque os clientes não explicam o que querem! 😂",
    "Minha div está centralizada! Sou oficialmente um desenvolvedor sênior de CSS. 🎨",
    "Onde o programador compra pão? No web-browser! 🥖",
    "Por que o Javascript foi ao psicólogo? Porque estava cheio de 'undefined' e promessas quebradas. 💔",
    "Compilar é como rezar: você fecha os olhos, aperta o botão e espera que nenhum erro de sintaxe apareça. 🙏"
  ];

  const handleSpeak = () => {
    if (text.trim()) {
      sendAgentSpeech(agent.id, text.trim(), 'info');
      setText('');
      onClose();
    }
  };

  const handleCuriosity = () => {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    sendAgentSpeech(agent.id, randomJoke, 'thinking');
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      border: `2px solid ${levelInfo.color}`,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      width: '340px',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, color: '#f4f4f5', fontSize: '1rem', fontWeight: 'bold' }}>
            {agentName}
          </h4>
          <span style={{ fontSize: '0.75rem', color: levelInfo.color, fontWeight: 'semibold' }}>
            {levelInfo.title} (XP: {agent.toolCallCount || 0})
          </span>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite algo para o agente dizer..."
          onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
          style={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            color: '#f4f4f5',
            padding: '8px 12px',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSpeak}
          style={{
            flex: 1,
            backgroundColor: levelInfo.color,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          Falar! 💬
        </button>
        <button
          onClick={handleCuriosity}
          style={{
            flex: 1,
            backgroundColor: '#27272a',
            color: '#e4e4e7',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '0.875rem',
            fontWeight: 'medium',
            cursor: 'pointer'
          }}
        >
          Piada / IA 🤖
        </button>
      </div>
    </div>
  );
}
