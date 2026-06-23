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
}

export type HostMessage =
  | { type: 'AGENT_SPAWNED'; agent: Agent }
  | { type: 'AGENT_STATUS_CHANGED'; agentId: string; status: AgentStatus; detail: string; tool: string | null }
  | { type: 'AGENT_REMOVED'; agentId: string }
  | { type: 'AGENT_SPEECH'; agentId: string; text: string; bubbleType: 'info' | 'warning' | 'done' | 'thinking' }
  | { type: 'INIT_STATE'; state: OfficeState };

export type WebviewMessage =
  | { type: 'READY' }
  | { type: 'ASSIGN_DESK'; agentId: string; deskId: number }
  | { type: 'SPAWN_AGENT'; provider: AgentProvider }
  | { type: 'SET_LOCALE'; locale: 'pt-BR' | 'en' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'SWAP_CHARACTER'; agentId: string }
  | { type: 'FOCUS_AGENT'; agentId: string }
  | { type: 'SET_AGENT_NAME'; agentId: string; name: string };
