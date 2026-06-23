import { useOfficeStore } from './store/officeStore';
import { Agent } from './types';

export function initMocks() {
  const store = useOfficeStore.getState();
  const baseFloorY = 300 - 60; // height is 300, floor is at height - 60

  const mockAgents: Agent[] = [
    {
      id: 'mock-1',
      name: 'Claude #1',
      provider: 'claude-code',
      status: 'typing',
      characterIndex: 0,
      deskIndex: 1,
      positionX: 0,
      positionY: baseFloorY,
      targetX: 120 + 0 * 180,
      targetY: baseFloorY,
      lastActivity: 'Writing src/App.tsx',
      activeSince: Date.now() - 120000,
      toolCallCount: 14,
      currentTool: 'write_file',
      animationFrame: 0,
      walkProgress: 0,
      speechBubble: null,
    },
    {
      id: 'mock-2',
      name: 'Gemini #2',
      provider: 'antigravity',
      status: 'thinking',
      characterIndex: 2,
      deskIndex: 1,
      positionX: 0,
      positionY: baseFloorY,
      targetX: 120 + 1 * 180,
      targetY: baseFloorY,
      lastActivity: 'Analyzing task',
      activeSince: Date.now() - 300000,
      toolCallCount: 5,
      currentTool: null,
      animationFrame: 0,
      walkProgress: 0,
      speechBubble: null,
    },
    {
      id: 'mock-3',
      name: 'Copilot',
      provider: 'copilot',
      status: 'waiting',
      characterIndex: 4,
      deskIndex: 2,
      positionX: 0,
      positionY: baseFloorY,
      targetX: 120 + 2 * 180,
      targetY: baseFloorY,
      lastActivity: 'Awaiting user input',
      activeSince: Date.now() - 10000,
      toolCallCount: 0,
      currentTool: null,
      animationFrame: 0,
      walkProgress: 0,
      speechBubble: null,
    }
  ];

  mockAgents.forEach(agent => {
    store.spawnAgent(agent);
    store.assignDesk(agent.id, agent.deskIndex + 1);
  });
}
