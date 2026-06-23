import { create } from 'zustand';
import { OfficeState, Agent, Desk, AgentStatus, Pet } from '../types';
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
  
  // Novas ações para Pets, Decoração e Party
  setDecorationMode: (isDeco: boolean) => void;
  setSelectedFurnitureId: (id: string | null) => void;
  setMapData: (mapData: any) => void;
  updatePets: (pets: Record<string, Pet>) => void;
  setPartyMode: (party: boolean) => void;
  addFurniture: (type: string, col: number, row: number) => void;
  moveFurniture: (uid: string, col: number, row: number) => void;
  rotateFurniture: (uid: string) => void;
  deleteFurniture: (uid: string) => void;
  sendAgentSpeech: (agentId: string, text: string, bubbleType?: 'info' | 'warning' | 'done' | 'thinking') => void;
}

export const useOfficeStore = create<OfficeStore>((set, get) => ({
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
  customLayouts: {},
  
  // Inicialização do estado novo
  isDecorationMode: false,
  selectedFurnitureId: null,
  mapData: null,
  isPartyMode: false,
  pets: {
    cat: {
      id: 'cat',
      name: 'Luna 🐱',
      type: 'cat',
      col: 15,
      row: 15,
      x: 0,
      y: 0,
      dir: 0,
      mirror: false,
      targetCol: 15,
      targetRow: 15,
      walkProgress: 0,
      lastInteractTime: 0
    },
    dog: {
      id: 'dog',
      name: 'Pipoca 🐶',
      type: 'dog',
      col: 12,
      row: 18,
      x: 0,
      y: 0,
      dir: 0,
      mirror: false,
      targetCol: 12,
      targetRow: 18,
      walkProgress: 0,
      lastInteractTime: 0
    }
  },

  spawnAgent: (agent) => set((state) => ({
    agents: { ...state.agents, [agent.id]: agent }
  })),

  updateAgentStatus: (agentId, status, detail, tool) => set((state) => {
    const agent = state.agents[agentId];
    if (!agent) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { 
          ...agent, 
          status, 
          lastActivity: detail, 
          currentTool: tool, 
          toolCallCount: tool ? agent.toolCallCount + 1 : agent.toolCallCount 
        }
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
  },

  // Novas implementações
  setDecorationMode: (isDeco) => set({ isDecorationMode: isDeco, selectedFurnitureId: null }),
  setSelectedFurnitureId: (id) => set({ selectedFurnitureId: id }),
  setMapData: (mapData) => set({ mapData }),
  updatePets: (pets) => set({ pets }),
  setPartyMode: (party) => set({ isPartyMode: party }),
  
  addFurniture: (type, col, row) => set((state) => {
    if (!state.mapData) return state;
    const uid = 'f-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newFurniture = [...(state.mapData.furniture || []), { uid, type, col, row }];
    const updatedMapData = { ...state.mapData, furniture: newFurniture };
    
    // Envia o novo layout para persistência no VS Code
    vscode.postMessage({ type: 'SAVE_LAYOUT', theme: state.theme, furniture: newFurniture });
    
    return { mapData: updatedMapData, selectedFurnitureId: uid };
  }),

  moveFurniture: (uid, col, row) => set((state) => {
    if (!state.mapData) return state;
    const newFurniture = (state.mapData.furniture || []).map((f: any) => 
      f.uid === uid ? { ...f, col, row } : f
    );
    const updatedMapData = { ...state.mapData, furniture: newFurniture };
    
    vscode.postMessage({ type: 'SAVE_LAYOUT', theme: state.theme, furniture: newFurniture });
    
    return { mapData: updatedMapData };
  }),

  rotateFurniture: (uid) => set((state) => {
    if (!state.mapData) return state;
    const newFurniture = (state.mapData.furniture || []).map((f: any) => {
      if (f.uid !== uid) return f;
      // Lógica de rotação simples alterando os tipos e espelhamentos
      let nextType = f.type;
      if (f.type === 'DESK_FRONT') nextType = 'DESK_SIDE';
      else if (f.type === 'DESK_SIDE') nextType = 'DESK_SIDE:left';
      else if (f.type === 'DESK_SIDE:left') nextType = 'DESK_FRONT';
      
      else if (f.type === 'PC_FRONT_OFF') nextType = 'PC_SIDE';
      else if (f.type === 'PC_FRONT_ON') nextType = 'PC_SIDE';
      else if (f.type === 'PC_SIDE') nextType = 'PC_SIDE:left';
      else if (f.type === 'PC_SIDE:left') nextType = 'PC_FRONT_OFF';

      else if (f.type === 'SOFA_FRONT') nextType = 'SOFA_SIDE';
      else if (f.type === 'SOFA_SIDE') nextType = 'SOFA_BACK';
      else if (f.type === 'SOFA_BACK') nextType = 'SOFA_SIDE:left';
      else if (f.type === 'SOFA_SIDE:left') nextType = 'SOFA_FRONT';
      
      return { ...f, type: nextType };
    });
    
    const updatedMapData = { ...state.mapData, furniture: newFurniture };
    vscode.postMessage({ type: 'SAVE_LAYOUT', theme: state.theme, furniture: newFurniture });
    
    return { mapData: updatedMapData };
  }),

  deleteFurniture: (uid) => set((state) => {
    if (!state.mapData) return state;
    const newFurniture = (state.mapData.furniture || []).filter((f: any) => f.uid !== uid);
    const updatedMapData = { ...state.mapData, furniture: newFurniture };
    
    vscode.postMessage({ type: 'SAVE_LAYOUT', theme: state.theme, furniture: newFurniture });
    
    return { mapData: updatedMapData, selectedFurnitureId: null };
  }),

  sendAgentSpeech: (agentId, text, bubbleType = 'info') => set((state) => {
    const agent = state.agents[agentId];
    if (!agent) return state;
    
    return {
      agents: {
        ...state.agents,
        [agentId]: {
          ...agent,
          speechBubble: {
            text,
            type: bubbleType,
            expiresAt: Date.now() + 5000 // 5 segundos
          }
        }
      }
    };
  })
}));
