import * as fs from 'fs';
import * as path from 'path';
import { IAgentAdapter, AgentEvent } from './IAgentAdapter';
import { AgentProvider, AgentStatus } from '../../webview-ui/src/types';
import { findActiveSession } from '../utils/pathUtils';

export class ClaudeCodeAdapter implements IAgentAdapter {
  readonly provider: AgentProvider = 'claude-code';
  private intervalId?: NodeJS.Timeout;
  private handler?: (event: AgentEvent) => void;
  private activeAgentId: string | null = null;
  private lastReadSize = 0;
  private lastEventTime = 0;

  async start(workspacePath: string): Promise<void> {
    const sessionFile = findActiveSession(workspacePath);
    if (!sessionFile) {
      console.log('No Claude Code session found for workspace.');
      return;
    }

    this.activeAgentId = 'claude-' + Date.now();
    this.lastEventTime = Date.now();

    this.intervalId = setInterval(() => {
      this.pollFile(sessionFile);
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
    return this.activeAgentId ? [this.activeAgentId] : [];
  }

  private checkIdle() {
    if (!this.activeAgentId || !this.handler) return;
    if (Date.now() - this.lastEventTime > 5000) {
      // Emit idle event
      this.handler({
        agentId: this.activeAgentId,
        status: 'idle',
        detail: 'Idle',
        tool: null,
        timestamp: Date.now()
      });
      // prevent spam
      this.lastEventTime = Date.now();
    }
  }

  private pollFile(filePath: string) {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.size > this.lastReadSize) {
      const buffer = Buffer.alloc(stat.size - this.lastReadSize);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, this.lastReadSize);
      fs.closeSync(fd);
      
      this.lastReadSize = stat.size;
      this.parseNewLines(buffer.toString('utf-8'));
    }
  }

  private parseNewLines(content: string) {
    const lines = content.split('\n').filter(l => l.trim() !== '');
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        this.processRecord(record);
      } catch (e) {
        // ignore parse error
      }
    }
  }

  private processRecord(record: any) {
    if (!this.handler || !this.activeAgentId) return;

    let status: AgentStatus = 'thinking';
    let detail = 'Processando...';
    let tool = null;

    if (record.type === 'assistant' && record.tool_use) {
      const toolUse = record.tool_use;
      const toolName = toolUse.name;
      tool = toolName;

      let argDetail = '';
      if (toolUse.input) {
        const input = toolUse.input;
        const getInput = (name: string): string | undefined => {
          const val = input[name];
          if (typeof val === 'string') {
            return val.replace(/^["']|["']$/g, '');
          }
          return val;
        };

        const targetFile = getInput('TargetFile');
        const absolutePath = getInput('AbsolutePath');
        const inputPath = getInput('path');
        const command = getInput('command');

        if (targetFile) {
          argDetail = `: ${path.basename(targetFile)}`;
        } else if (absolutePath) {
          argDetail = `: ${path.basename(absolutePath)}`;
        } else if (inputPath) {
          argDetail = `: ${path.basename(inputPath)}`;
        } else if (command) {
          argDetail = `: ${command.length > 18 ? command.substring(0, 15) + '...' : command}`;
        }
      }

      if (['Write', 'Edit', 'MultiEdit', 'replace_file_content', 'write_to_file'].some(n => toolName.includes(n))) {
        status = 'typing';
        detail = `Editando${argDetail}`;
      } else if (['Read', 'Glob', 'Grep', 'view_file', 'grep_search'].some(n => toolName.includes(n))) {
        status = 'reading';
        detail = `Lendo${argDetail}`;
      } else if (toolName === 'Bash' || toolName.includes('run_command')) {
        status = 'typing';
        detail = `Executando${argDetail}`;
      } else {
        status = 'thinking';
        detail = `${toolName}${argDetail}`;
      }
    } else if (record.type === 'user' && record.role === 'input_required') {
      status = 'waiting';
      detail = 'Aguardando entrada';
    }

    this.lastEventTime = Date.now();
    this.handler({
      agentId: this.activeAgentId,
      status,
      detail,
      tool,
      timestamp: Date.now()
    });
  }
}
