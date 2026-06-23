export type AgentStatus =
  | 'idle'
  | 'walking'
  | 'typing'
  | 'reading'
  | 'thinking'
  | 'waiting'
  | 'done';

export type AgentProvider = 'claude-code' | 'antigravity' | 'copilot' | 'generic';

export interface Agent {
  id: string;
  name: string;
  provider: AgentProvider;
  status: AgentStatus;
  characterIndex: number;
  deskIndex: number;
  positionX: number;
  positionY: number;
  targetX: number;
  targetY: number;
  lastActivity: string;
  activeSince: number;
  toolCallCount: number;
  currentTool: string | null;
  animationFrame: number;
  walkProgress: number;
  speechBubble: {
    text: string;
    type: 'info' | 'warning' | 'done' | 'thinking';
    expiresAt: number;
  } | null;
}

export interface LevelInfo {
  level: number;
  title: string;
  accessory: 'none' | 'glasses' | 'headphones' | 'crown';
  color: string;
}

export function getAgentLevelInfo(toolCallCount: number, locale: 'pt-BR' | 'en' = 'pt-BR'): LevelInfo {
  const isEn = locale === 'en';
  if (toolCallCount >= 60) {
    return { level: 4, title: 'Tech Lead', accessory: 'crown', color: '#f43f5e' }; // rose
  } else if (toolCallCount >= 30) {
    return { level: 3, title: isEn ? 'Senior' : 'Sênior', accessory: 'glasses', color: '#a855f7' }; // purple
  } else if (toolCallCount >= 10) {
    return { level: 2, title: isEn ? 'Mid-level' : 'Pleno', accessory: 'headphones', color: '#3b82f6' }; // blue
  } else {
    return { level: 1, title: isEn ? 'Junior' : 'Estagiário', accessory: 'none', color: '#a1a1aa' }; // gray
  }
}

export interface Pet {
  id: string;
  name: string;
  type: 'cat' | 'dog';
  col: number;
  row: number;
  x: number;
  y: number;
  dir: number;
  mirror: boolean;
  targetCol: number;
  targetRow: number;
  walkProgress: number;
  lastInteractTime: number;
}

export interface Desk {
  id: number;
  x: number;
  y: number;
  label: string;
  assignedAgentId: string | null;
}

export interface OfficeState {
  agents: Record<string, Agent>;
  desks: Desk[];
  zoom: number;
  offsetX: number;
  panX: number;
  panY: number;
  showSupervisorPanel: boolean;
  theme: string;
  locale: 'pt-BR' | 'en';
  customNames: Record<string, string>;
  isDecorationMode: boolean;
  selectedFurnitureId: string | null;
  mapData: any;
  pets: Record<string, Pet>;
  isPartyMode: boolean;
}

export type HostMessage =
  | { type: 'AGENT_SPAWNED'; agent: Agent }
  | { type: 'AGENT_STATUS_CHANGED'; agentId: string; status: AgentStatus; detail: string; tool: string | null }
  | { type: 'AGENT_REMOVED'; agentId: string }
  | { type: 'AGENT_SPEECH'; agentId: string; text: string; bubbleType: 'info' | 'warning' | 'done' | 'thinking' }
  | { type: 'INIT_STATE'; state: OfficeState }
  | { type: 'PARTY_MODE' };

export type WebviewMessage =
  | { type: 'READY' }
  | { type: 'ASSIGN_DESK'; agentId: string; deskId: number }
  | { type: 'SPAWN_AGENT'; provider: AgentProvider }
  | { type: 'SET_LOCALE'; locale: 'pt-BR' | 'en' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'SWAP_CHARACTER'; agentId: string }
  | { type: 'FOCUS_AGENT'; agentId: string }
  | { type: 'SET_AGENT_NAME'; agentId: string; name: string }
  | { type: 'SAVE_LAYOUT'; theme: string; furniture: any[] }
  | { type: 'UPDATE_PREFS'; zoom?: number; locale?: 'pt-BR' | 'en'; showSupervisorPanel?: boolean };
