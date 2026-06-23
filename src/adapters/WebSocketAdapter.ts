import * as vscode from 'vscode';
const WebSocket = require('ws');
import { IAgentAdapter, AgentEvent } from './IAgentAdapter';
import { AgentProvider } from '../../webview-ui/src/types';

export class WebSocketAdapter implements IAgentAdapter {
  readonly provider: AgentProvider = 'generic';
  private handler?: (event: AgentEvent) => void;
  private wss: any = null;
  private activeAgents: Set<string> = new Set();
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('PixelCrew');
  }

  async start(workspacePath: string): Promise<void> {
    const port = vscode.workspace.getConfiguration('pixelcrew').get<number>('websocketPort', 7891);
    
    try {
      this.wss = new WebSocket.Server({ port });
      
      this.wss.on('connection', (ws) => {
        this.outputChannel.appendLine('WebSocket client connected');
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            this.processMessage(data);
          } catch (e) {
            this.outputChannel.appendLine('Failed to parse WS message: ' + e);
          }
        });
      });
      
      this.wss.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          vscode.window.showWarningMessage(`PixelCrew: Port ${port} is in use. WebSocket adapter could not start.`);
        } else {
          this.outputChannel.appendLine('WS Error: ' + err.message);
        }
      });
      
      this.outputChannel.appendLine(`WebSocket server started on port ${port}`);
    } catch (e: any) {
      this.outputChannel.appendLine('Failed to start WS server: ' + e.message);
    }
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
    }
  }

  onEvent(handler: (event: AgentEvent) => void): void {
    this.handler = handler;
  }

  listActiveAgents(): string[] {
    return Array.from(this.activeAgents);
  }

  private processMessage(data: any) {
    if (!this.handler) return;

    if (data.agentId && data.status) {
      this.activeAgents.add(data.agentId);
      
      this.handler({
        agentId: data.agentId,
        status: data.status,
        detail: data.detail || 'Working...',
        tool: data.tool || null,
        timestamp: Date.now()
      });
    }
  }
}
