import * as vscode from 'vscode';
import { PixelCrewPanel } from './PixelCrewPanel';
import { AgentRegistry } from './AgentRegistry';
import { ClaudeCodeAdapter } from './adapters/ClaudeCodeAdapter';
import { AntigravityAdapter } from './adapters/AntigravityAdapter';
import { WebSocketAdapter } from './adapters/WebSocketAdapter';

export function activate(context: vscode.ExtensionContext) {
  console.log('PixelCrew is now active!');

  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

  const claudeAdapter = new ClaudeCodeAdapter();
  const antigravityAdapter = new AntigravityAdapter();
  const wsAdapter = new WebSocketAdapter();

  [claudeAdapter, antigravityAdapter, wsAdapter].forEach(adapter => {
    adapter.onEvent((event) => AgentRegistry.getInstance().updateAgentStatus(event.agentId, event.status, event.detail, event.tool));
    adapter.start(workspacePath);
  });

  let openOfficeCmd = vscode.commands.registerCommand('pixelcrew.openOffice', () => {
    PixelCrewPanel.createOrShow(context.extensionUri, context);
  });

  let spawnAgentCmd = vscode.commands.registerCommand('pixelcrew.spawnAgent', async () => {
    const options = [
      { label: '$(beaker) Demo (mock)', id: 'mock' },
      { label: '$(robot) Claude Code', id: 'claude-code' },
      { label: '$(sparkle) Antigravity / Gemini', id: 'antigravity' },
      { label: '$(plug) Generic WebSocket (porta 7891)', id: 'generic' }
    ];
    
    const picked = await vscode.window.showQuickPick(options, { placeHolder: 'Selecione o tipo de agente' });
    if (picked) {
      if (picked.id === 'mock') {
        AgentRegistry.getInstance().spawnAgent({
          id: 'mock-' + Date.now(),
          name: 'Demo Agent',
          provider: 'generic',
          status: 'idle',
          characterIndex: Math.floor(Math.random() * 6),
          deskIndex: Object.keys(AgentRegistry.getInstance().getAgents()).length % 4,
          positionX: 0,
          positionY: 260,
          targetX: 80 + (Object.keys(AgentRegistry.getInstance().getAgents()).length % 4) * 120,
          targetY: 260,
          lastActivity: 'Started',
          activeSince: Date.now(),
          toolCallCount: 0,
          currentTool: null,
          animationFrame: 0,
          walkProgress: 0,
          speechBubble: null
        });
      } else {
        vscode.window.showInformationMessage('Spawn para ' + picked.label + ' será detectado automaticamente.');
      }
    }
  });

  let toggleLocaleCmd = vscode.commands.registerCommand('pixelcrew.toggleLocale', () => {
    vscode.window.showInformationMessage('Toggle Locale: Not implemented yet');
  });

  let resetLayoutCmd = vscode.commands.registerCommand('pixelcrew.resetLayout', () => {
    vscode.window.showInformationMessage('Reset Layout: Not implemented yet');
  });

  context.subscriptions.push(openOfficeCmd, spawnAgentCmd, toggleLocaleCmd, resetLayoutCmd);
}

export function deactivate() {}
