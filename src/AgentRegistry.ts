import * as vscode from 'vscode';
import { Agent, AgentStatus, OfficeState } from '../webview-ui/src/types';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();
  private manuallyRemovedAgents: Set<string> = new Set();
  private panelCallback?: (msg: any) => void;

  private constructor() {}

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public setPanelCallback(cb: (msg: any) => void) {
    this.panelCallback = cb;
  }

  public getAgents(): Record<string, Agent> {
    return Object.fromEntries(this.agents);
  }

  public spawnAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
    if (this.panelCallback) {
      this.panelCallback({ type: 'AGENT_SPAWNED', agent });
    }
  }

  public removeAgent(agentId: string) {
    this.agents.delete(agentId);
    this.manuallyRemovedAgents.add(agentId);
    if (this.panelCallback) {
      this.panelCallback({ type: 'AGENT_REMOVED', agentId });
    }
  }

  public updateAgentStatus(agentId: string, status: AgentStatus, detail: string, tool: string | null) {
    let agent = this.agents.get(agentId);
    
    // Ignore manually removed agents (don't respawn them)
    if (this.manuallyRemovedAgents.has(agentId)) {
      return;
    }

    // Auto-spawn se não existir!
    if (!agent) {
      agent = {
        id: agentId,
        name: agentId.startsWith('claude') ? 'Claude' : agentId.startsWith('antigravity') ? 'Antigravity' : 'Agent',
        provider: agentId.split('-')[0] as any,
        status: 'idle',
        characterIndex: Math.floor(Math.random() * 6),
        deskIndex: this.agents.size % 4,
        positionX: 0,
        positionY: 0,
        targetX: 0,
        targetY: 0,
        lastActivity: 'Joined the office',
        activeSince: Date.now(),
        toolCallCount: 0,
        currentTool: null,
        animationFrame: 0,
        walkProgress: 0,
        speechBubble: null
      };
      this.spawnAgent(agent);
    }

    agent.status = status;
    agent.lastActivity = detail;
    agent.currentTool = tool;
    if (tool) agent.toolCallCount++;
    if (this.panelCallback) {
      this.panelCallback({ type: 'AGENT_STATUS_CHANGED', agentId, status, detail, tool });
    }
  }
}
