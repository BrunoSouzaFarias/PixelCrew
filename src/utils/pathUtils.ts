import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

export function getClaudeProjectsDir(): string {
  const customPath = vscode.workspace.getConfiguration('pixelcrew').get<string>('claudeLogsPath');
  if (customPath && customPath.trim() !== '') {
    return customPath.replace(/^~(?=$|\/|\\)/, os.homedir());
  }
  return path.join(os.homedir(), '.claude', 'projects');
}

export function hashWorkspacePath(absPath: string): string {
  return crypto.createHash('sha256').update(absPath).digest('hex');
}

export function findActiveSession(workspacePath: string): string | null {
  const projectsDir = getClaudeProjectsDir();
  const hash = hashWorkspacePath(workspacePath);
  const sessionDir = path.join(projectsDir, hash);
  
  if (!fs.existsSync(sessionDir)) {
    return null;
  }
  
  const files = fs.readdirSync(sessionDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(sessionDir, f));
    
  if (files.length === 0) return null;
  
  // Sort by modified time, newest first
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

export function findAntigravitySessions(): string[] {
  let brainDir = vscode.workspace.getConfiguration('pixelcrew').get<string>('antigravityLogsPath');
  if (brainDir && brainDir.trim() !== '') {
    brainDir = brainDir.replace(/^~(?=$|\/|\\)/, os.homedir());
  } else {
    brainDir = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
  }

  if (!fs.existsSync(brainDir)) return [];

  const sessions = fs.readdirSync(brainDir);
  const activeTranscripts: string[] = [];
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const session of sessions) {
    const transcriptPath = path.join(brainDir, session, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      const stat = fs.statSync(transcriptPath);
      // Only include sessions modified in the last 24 hours to avoid reading huge old logs
      if (now - stat.mtimeMs < ONE_DAY) {
        activeTranscripts.push(transcriptPath);
      }
    }
  }

  return activeTranscripts;
}
