import { create } from 'zustand';
import { OfficeState, Agent, Desk, AgentStatus } from '../types';
import { vscode } from '../vscodeApi';

interface OfficeStore extends OfficeState {
  spawnAgent: (agent: Agent) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus, detail: string, tool: string | null) => void;
  removeAgent: (agentId: string) => void;
  assignDesk: (agentId: string, deskId: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setTheme: (theme: string) => void;
  setLocale: (locale: 'pt-BR' | 'en') => void;
  toggleSupervisorPanel: () => void;
  setAgents: (agents: Record<string, Agent>) => void;
  setDesks: (desks: Desk[]) => void;
  swapCharacter: (agentId: string) => void;
  setCustomName: (agentId: string, name: string) => void;
}

export const useOfficeStore = create<OfficeStore>((set) => ({
  agents: {},
  desks: [
    { id: 1, x: 80, y: 0, label: 'Desk 1', assignedAgentId: null },
    { id: 2, x: 200, y: 0, label: 'Desk 2', assignedAgentId: null },
    { id: 3, x: 320, y: 0, label: 'Desk 3', assignedAgentId: null },
    { id: 4, x: 440, y: 0, label: 'Desk 4', assignedAgentId: null },
  ],
  zoom: 2,
  offsetX: 0,
  panX: 0,
  panY: 0,
  showSupervisorPanel: true,
  theme: 'dark',
  locale: 'pt-BR',
  customNames: {},

  spawnAgent: (agent) => set((state) => ({
    agents: { ...state.agents, [agent.id]: agent }
  })),

  updateAgentStatus: (agentId, status, detail, tool) => set((state) => {
    const agent = state.agents[agentId];
    if (!agent) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { ...agent, status, lastActivity: detail, currentTool: tool, toolCallCount: tool ? agent.toolCallCount + 1 : agent.toolCallCount }
      }
    };
  }),

  removeAgent: (agentId) => set((state) => {
    const newAgents = { ...state.agents };
    delete newAgents[agentId];
    const newDesks = state.desks.map(d => d.assignedAgentId === agentId ? { ...d, assignedAgentId: null } : d);
    return { agents: newAgents, desks: newDesks };
  }),

  assignDesk: (agentId, deskId) => set((state) => {
    const newDesks = state.desks.map(d => {
      if (d.id === deskId) return { ...d, assignedAgentId: agentId };
      if (d.assignedAgentId === agentId) return { ...d, assignedAgentId: null };
      return d;
    });
    return { desks: newDesks };
  }),

  setZoom: (zoom) => {
    set({ zoom });
    vscode.postMessage({ type: 'UPDATE_PREFS', zoom });
  },
  setPan: (panX, panY) => set({ panX, panY }),
  setTheme: (theme) => {
    set({ theme });
    vscode.postMessage({ type: 'SET_THEME', theme });
  },
  setLocale: (locale) => {
    set({ locale });
    vscode.postMessage({ type: 'UPDATE_PREFS', locale });
  },
  toggleSupervisorPanel: () => set((state) => {
    const newState = !state.showSupervisorPanel;
    vscode.postMessage({ type: 'UPDATE_PREFS', showSupervisorPanel: newState });
    return { showSupervisorPanel: newState };
  }),
  setAgents: (agents) => set({ agents }),
  setDesks: (desks) => set({ desks }),
  swapCharacter: (agentId) => {
    set((state) => {
      const agent = state.agents[agentId];
      if (!agent) return state;
      return {
        agents: {
          ...state.agents,
          [agentId]: { ...agent, characterIndex: (agent.characterIndex + 1) % 6 }
        }
      };
    });
    vscode.postMessage({ type: 'SWAP_CHARACTER', agentId });
  },
  setCustomName: (agentId, name) => {
    set((state) => ({
      customNames: { ...state.customNames, [agentId]: name }
    }));
    vscode.postMessage({ type: 'SET_AGENT_NAME', agentId, name });
  }
}));
