import React, { useEffect } from 'react';
import { useOfficeStore } from './store/officeStore';
import { i18n } from './i18n';
import { OfficeCanvas } from './components/OfficeCanvas';
import { Toolbar } from './components/Toolbar';
import { SupervisorPanel } from './components/SupervisorPanel';
import { vscode } from './vscodeApi';

function App() {
  const { zoom, locale, showSupervisorPanel, setAgents, setDesks } = useOfficeStore();
  const t = i18n[locale];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'INIT_STATE':
          useOfficeStore.setState(message.state);
          break;
        case 'AGENT_SPAWNED':
          useOfficeStore.getState().spawnAgent(message.agent);
          break;
        case 'AGENT_STATUS_CHANGED':
          useOfficeStore.getState().updateAgentStatus(
            message.agentId,
            message.status,
            message.detail,
            message.tool
          );
          break;
        case 'AGENT_REMOVED':
          useOfficeStore.getState().removeAgent(message.agentId);
          break;
        case 'PARTY_MODE': {
          const store = useOfficeStore.getState();
          store.setPartyMode(true);
          setTimeout(() => {
            useOfficeStore.getState().setPartyMode(false);
          }, 10000); // 10 segundos de festa!
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'READY' });

    const idlePhrases = [
      "Bora codar! 🚀",
      "Me diga o que você está pensando...",
      "Estou muito parado... 🥱",
      "Café aceita? ☕",
      "Procurando bugs... 🐛",
      "Compilando pensamentos...",
      "Mais um dia produtivo! 💻",
      "Hora de programar!",
      "Quem precisa de café?",
      "Tudo compilando perfeitamente!"
    ];

    const idleInterval = setInterval(() => {
      const state = useOfficeStore.getState();
      const agents = { ...state.agents };
      let updated = false;

      Object.keys(agents).forEach(id => {
        const agent = agents[id];
        if (agent.status === 'idle') {
          const isBubbleActive = agent.speechBubble && agent.speechBubble.expiresAt > Date.now();
          if (!isBubbleActive && Math.random() < 0.25) {
            const text = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
            agents[id] = {
              ...agent,
              speechBubble: {
                text,
                type: 'info',
                expiresAt: Date.now() + 4000 // dura 4 segundos
              }
            };
            updated = true;
          }
        }
      });

      if (updated) {
        useOfficeStore.setState({ agents });
      }
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(idleInterval);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#18181b', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <OfficeCanvas />
        </div>

        {showSupervisorPanel && <SupervisorPanel />}
      </div>
    </div>
  );
}

export default App;
