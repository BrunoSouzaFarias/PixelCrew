import { AgentStatus, AgentProvider } from '../../webview-ui/src/types';

export interface AgentEvent {
  agentId: string;
  status: AgentStatus;
  detail: string;
  tool: string | null;
  timestamp: number;
}

export interface IAgentAdapter {
  readonly provider: AgentProvider;
  start(workspacePath: string): Promise<void>;
  stop(): void;
  onEvent(handler: (event: AgentEvent) => void): void;
  listActiveAgents(): string[];
}
