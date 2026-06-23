import * as fs from 'fs';
import { IAgentAdapter, AgentEvent } from './IAgentAdapter';
import { AgentProvider, AgentStatus } from '../../webview-ui/src/types';
import { findAntigravitySessions } from '../utils/pathUtils';
import * as path from 'path';

interface SessionState {
  agentId: string;
  lastReadSize: number;
  lastEventTime: number;
  filePath: string;
}

export class AntigravityAdapter implements IAgentAdapter {
  readonly provider: AgentProvider = 'antigravity';
  private handler?: (event: AgentEvent) => void;
  private sessions = new Map<string, SessionState>();
  private intervalId?: NodeJS.Timeout;

  async start(workspacePath: string): Promise<void> {
    this.intervalId = setInterval(() => {
      this.pollAllSessions();
      this.checkIdle();
    }, 500);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onEvent(handler: (event: AgentEvent) => void): void {
    this.handler = handler;
  }

  listActiveAgents(): string[] {
    return Array.from(this.sessions.values()).map(s => s.agentId);
  }

  private pollAllSessions() {
    const sessionFiles = findAntigravitySessions();
    for (const filePath of sessionFiles) {
      // Use the directory name as the session ID
      const sessionId = path.basename(path.dirname(path.dirname(path.dirname(filePath))));
      
      if (!this.sessions.has(sessionId)) {
        // Only spawn if it's currently active (has changed in last 5 mins) to avoid spawning 100 dead agents
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtimeMs > 5 * 60 * 1000) continue;

        this.sessions.set(sessionId, {
          agentId: 'antigravity-' + sessionId.substring(0, 8),
          lastReadSize: stat.size, // start reading from end if it's an old file, or maybe 0? Let's start from end to not replay history.
          lastEventTime: Date.now(),
          filePath: filePath
        });
        
        // Emita um evento idle initial para o agente "brotar"
        if (this.handler) {
          this.handler({
            agentId: 'antigravity-' + sessionId.substring(0, 8),
            status: 'idle',
            detail: 'Started',
            tool: null,
            timestamp: Date.now()
          });
        }
      }

      const sessionState = this.sessions.get(sessionId)!;
      this.pollFile(sessionState);
    }
  }

  private checkIdle() {
    if (!this.handler) return;
    const now = Date.now();
    for (const [sessionId, state] of this.sessions.entries()) {
      if (now - state.lastEventTime > 15000) {
        this.handler({
          agentId: state.agentId,
          status: 'idle',
          detail: 'Idle',
          tool: null,
          timestamp: now
        });
        state.lastEventTime = now;
      }
    }
  }

  private pollFile(state: SessionState) {
    if (!fs.existsSync(state.filePath)) return;
    const stat = fs.statSync(state.filePath);
    if (stat.size > state.lastReadSize) {
      const buffer = Buffer.alloc(stat.size - state.lastReadSize);
      const fd = fs.openSync(state.filePath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, state.lastReadSize);
      fs.closeSync(fd);
      
      state.lastReadSize = stat.size;
      this.parseNewLines(buffer.toString('utf-8'), state);
    }
  }

  private parseNewLines(content: string, state: SessionState) {
    const lines = content.split('\n').filter(l => l.trim() !== '');
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        this.processRecord(record, state);
      } catch (e) {
        // ignore parse error
      }
    }
  }

  private processRecord(record: any, state: SessionState) {
    if (!this.handler) return;

    // Ignore system logs (tool outputs/responses) so we don't overwrite the active tool-use status
    if (record.source === 'SYSTEM') {
      return;
    }

    let status: AgentStatus | null = null;
    let detail = '';
    let tool = null;

    if (record.tool_calls && record.tool_calls.length > 0) {
      const toolCall = record.tool_calls[0];
      const toolName = toolCall.name || record.type || '';
      tool = toolName;

      let argDetail = '';
      const args = toolCall.args || toolCall.arguments;
      if (args) {
        const getArg = (name: string): string | undefined => {
          const lowerName = name.toLowerCase();
          for (const key of Object.keys(args)) {
            if (key.toLowerCase() === lowerName) {
              const val = args[key];
              if (typeof val === 'string') {
                return val.replace(/^["']|["']$/g, '');
              }
              return val;
            }
          }
          return undefined;
        };

        const targetFile = getArg('targetfile') || getArg('target_file');
        const absolutePath = getArg('absolutepath') || getArg('absolute_path') || getArg('path');
        const searchPath = getArg('searchpath') || getArg('search_path');
        const commandLine = getArg('commandline') || getArg('command_line') || getArg('command');
        const url = getArg('url');

        if (targetFile) {
          argDetail = `: ${path.basename(targetFile)}`;
        } else if (absolutePath) {
          argDetail = `: ${path.basename(absolutePath)}`;
        } else if (searchPath) {
          argDetail = `: ${path.basename(searchPath)}`;
        } else if (commandLine) {
          argDetail = `: ${commandLine.length > 18 ? commandLine.substring(0, 15) + '...' : commandLine}`;
        } else if (url) {
          argDetail = `: ${url}`;
        }
      }

      const lowerTool = toolName.toLowerCase();
      if (lowerTool.includes('write') || lowerTool.includes('replace') || lowerTool.includes('edit')) {
        status = 'typing';
        detail = `Editando${argDetail}`;
      } else if (lowerTool.includes('read') || lowerTool.includes('list') || lowerTool.includes('grep') || lowerTool.includes('view')) {
        status = 'reading';
        detail = `Lendo${argDetail}`;
      } else if (lowerTool.includes('run_command')) {
        status = 'typing';
        detail = `Executando${argDetail}`;
      } else {
        status = 'thinking';
        detail = `${toolName}${argDetail}`;
      }
    } else if (record.type === 'USER_INPUT' || record.source === 'USER_EXPLICIT') {
      status = 'thinking'; 
      detail = 'Analisando entrada';
    }

    if (status) {
      state.lastEventTime = Date.now();
      this.handler({
        agentId: state.agentId,
        status,
        detail,
        tool,
        timestamp: Date.now()
      });
    }
  }
}
