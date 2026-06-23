import * as vscode from 'vscode';
import { AgentRegistry } from './AgentRegistry';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out', 'webview')],
  };
}

export class PixelCrewPanel {
  public static currentPanel: PixelCrewPanel | undefined;
  public static readonly viewType = 'pixelcrew.officeView';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (PixelCrewPanel.currentPanel) {
      PixelCrewPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      PixelCrewPanel.viewType,
      'PixelCrew Office',
      column,
      {
        ...getWebviewOptions(extensionUri),
        retainContextWhenHidden: true,
      }
    );

    PixelCrewPanel.currentPanel = new PixelCrewPanel(panel, extensionUri, context);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private readonly context: vscode.ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();
    
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'READY':
            this.sendInitState();
            return;
          case 'SPAWN_AGENT':
            vscode.commands.executeCommand('pixelcrew.spawnAgent');
            return;
          case 'UPDATE_PREFS':
            if (message.zoom !== undefined) this.context.globalState.update('pixelcrew.zoom', message.zoom);
            if (message.locale !== undefined) this.context.globalState.update('pixelcrew.locale', message.locale);
            if (message.showSupervisorPanel !== undefined) this.context.globalState.update('pixelcrew.showSupervisor', message.showSupervisorPanel);
            return;
          case 'REMOVE_AGENT':
            console.log('PixelCrewPanel REMOVE_AGENT received:', message.agentId);
            vscode.window.showInformationMessage(`Removendo agente: ${message.agentId}`);
            AgentRegistry.getInstance().removeAgent(message.agentId);
            return;
          case 'SAVE_LAYOUT':
            if (message.theme && message.furniture) {
              this.context.globalState.update(`pixelcrew.layout.${message.theme}`, message.furniture);
            }
            return;
        }
      },
      null,
      this._disposables
    );

    AgentRegistry.getInstance().setPanelCallback((msg) => {
      this._panel.webview.postMessage(msg);
    });
  }

  public triggerPartyMode() {
    this._panel.webview.postMessage({ type: 'PARTY_MODE' });
  }

  private sendInitState() {
    const registry = AgentRegistry.getInstance();
    
    const zoom = this.context.globalState.get<number>('pixelcrew.zoom', 2);
    const locale = this.context.globalState.get<string>('pixelcrew.locale', 'pt-BR');
    const showSupervisorPanel = this.context.globalState.get<boolean>('pixelcrew.showSupervisor', true);

    const darkFurniture = this.context.globalState.get<any[]>('pixelcrew.layout.dark', null);
    const lightFurniture = this.context.globalState.get<any[]>('pixelcrew.layout.light', null);
    const hackerFurniture = this.context.globalState.get<any[]>('pixelcrew.layout.hacker-basement', null);

    const state = {
      agents: registry.getAgents(),
      desks: [
        { id: 1, x: 80, y: 0, label: 'Desk 1', assignedAgentId: null },
        { id: 2, x: 200, y: 0, label: 'Desk 2', assignedAgentId: null },
        { id: 3, x: 320, y: 0, label: 'Desk 3', assignedAgentId: null },
        { id: 4, x: 440, y: 0, label: 'Desk 4', assignedAgentId: null },
      ],
      zoom,
      offsetX: 0,
      showSupervisorPanel,
      theme: 'dark',
      locale,
      customLayouts: {
        'dark': darkFurniture,
        'light': lightFurniture,
        'hacker-basement': hackerFurniture
      }
    };
    this._panel.webview.postMessage({ type: 'INIT_STATE', state });
  }

  public dispose() {
    PixelCrewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'PixelCrew Office';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.css')
    );
    
    // Configura o Base URL para a pasta root do webview para servir os assets (imagens e jsons)
    const baseUrl = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')) + '/';
    
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource} https:;">
        <base href="${baseUrl}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>PixelCrew Webview</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
