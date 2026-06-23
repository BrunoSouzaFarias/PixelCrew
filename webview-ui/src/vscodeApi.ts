import type { WebviewMessage } from './types';

class VSCodeAPIWrapper {
  private readonly vsCodeApi: any;

  constructor() {
    if (typeof (window as any).acquireVsCodeApi === 'function') {
      this.vsCodeApi = (window as any).acquireVsCodeApi();
    } else {
      this.vsCodeApi = null;
    }
  }

  public postMessage(message: WebviewMessage | any) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log('postMessage mock:', message);
      if (message.type === 'SPAWN_AGENT') {
        const id = 'mock-' + Math.floor(Math.random() * 10000);
        const providers = ['claude-code', 'antigravity', 'copilot'];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const desk = Math.floor(Math.random() * 4);
        window.postMessage({
          type: 'AGENT_SPAWNED',
          agent: {
            id,
            name: `Agent ${id.substring(5)}`,
            provider,
            status: 'thinking',
            characterIndex: Math.floor(Math.random() * 6),
            deskIndex: desk,
            positionX: 0,
            positionY: 0,
            targetX: 120 + desk * 180,
            targetY: 0,
            lastActivity: 'Started working...',
            activeSince: Date.now(),
            toolCallCount: 0,
            currentTool: null,
            animationFrame: 0,
            walkProgress: 0,
            speechBubble: null,
          }
        }, '*');
      }
    }
  }

  public getState(): any {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      return null;
    }
  }

  public setState(state: any) {
    if (this.vsCodeApi) {
      this.vsCodeApi.setState(state);
    }
  }
}

export const vscode = new VSCodeAPIWrapper();
