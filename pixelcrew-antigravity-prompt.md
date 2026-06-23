# PixelCrew — Prompt de Construção Autônoma para Antigravity IDE

> **Instruções para o Antigravity:** Construa o projeto completo de forma autônoma, fase a fase, sem pedir confirmações intermediárias. Execute cada fase até os critérios de conclusão estarem satisfeitos antes de avançar. Não pule etapas. Crie todos os arquivos especificados.

---

## 🎯 VISÃO GERAL DO PROJETO

**Nome:** PixelCrew  
**Tagline:** *"Veja seus agentes de IA trabalhando — em pixel art."*  
**Tipo:** Extensão VS Code + Repositório Open Source para GitHub  
**Licença:** MIT

### O que é o PixelCrew

PixelCrew é uma extensão para VS Code que transforma cada agente de IA ativo no editor em um personagem pixel art animado dentro de um escritório virtual lado a lado (side-scrolling). Os personagens andam até as mesas, digitam quando trabalham, ficam com balão de pensamento quando o modelo está processando, e mostram balão de diálogo quando precisam de atenção do usuário.

**Diferenciais em relação aos projetos similares (pixel-agents / agent-office):**
1. **Agent-agnostic desde o início** — suporta Claude Code, Antigravity/Gemini, GitHub Copilot e qualquer agente via adapter genérico WebSocket
2. **Vista lateral (side-view)** em vez de top-down — personagens ficam visíveis de frente, como a imagem de referência
3. **Supervisor Dashboard** — painel lateral com métricas de todos os agentes (tempo ativo, ferramentas usadas, status)
4. **Sprites desenhados via Canvas 2D** — sem dependências de imagens externas, tudo embutido no código
5. **Suporte PT-BR** com toggle para EN

---

## 🛠️ STACK TÉCNICO

### Extension Host (Node.js, roda no VS Code)
- TypeScript 5.x
- VS Code Extension API (`@types/vscode: ^1.105.0`)
- esbuild (bundler do extension host)
- Node.js ≥ 18

### Webview UI (roda no browser sandbox do VS Code)
- React 18 + TypeScript
- Vite (dev server e bundler)
- Canvas 2D API (rendering do pixel art — sem libs externas de game engine)
- Zustand (state management leve)
- Tailwind CSS v3 (apenas para o painel de UI fora do canvas)

### Tooling
- npm workspaces (monorepo simples)
- ESLint + Prettier
- GitHub Actions (CI + build VSIX)

---

## 📁 ESTRUTURA COMPLETA DO PROJETO

```
pixelcrew/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # Testa e valida em PR
│   │   └── release.yml             # Gera VSIX e publica release
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── src/                            # Extension host TypeScript
│   ├── extension.ts                # Entry point - activate/deactivate
│   ├── PixelCrewPanel.ts           # WebviewPanel manager
│   ├── AgentRegistry.ts            # Registro de agentes ativos
│   ├── adapters/
│   │   ├── IAgentAdapter.ts        # Interface base
│   │   ├── ClaudeCodeAdapter.ts    # Lê JSONL do Claude Code
│   │   ├── AntigravityAdapter.ts   # Lê output do terminal Antigravity
│   │   └── WebSocketAdapter.ts     # Adapter genérico via WebSocket local
│   ├── StatusTracker.ts            # Converte eventos de log em estados
│   └── utils/
│       └── pathUtils.ts
├── webview-ui/                     # React + Vite (roda na webview)
│   ├── src/
│   │   ├── main.tsx                # Entry point React
│   │   ├── App.tsx                 # Root component
│   │   ├── vscodeApi.ts            # acquireVsCodeApi wrapper
│   │   ├── store/
│   │   │   └── officeStore.ts      # Zustand store global
│   │   ├── engine/
│   │   │   ├── GameLoop.ts         # requestAnimationFrame loop
│   │   │   ├── Renderer.ts         # Canvas 2D draw calls
│   │   │   ├── CharacterSprites.ts # Sprites pixel art desenhados via Canvas
│   │   │   ├── OfficeBackground.ts # Cenário: chão, mesas, monitores, plantas
│   │   │   └── Pathfinding.ts      # BFS simples para navegação
│   │   ├── components/
│   │   │   ├── OfficeCanvas.tsx    # Componente principal do canvas
│   │   │   ├── AgentCard.tsx       # Card de info do agente
│   │   │   ├── SupervisorPanel.tsx # Painel lateral supervisor
│   │   │   ├── SpeechBubble.tsx    # Balão renderizado em React (overlay)
│   │   │   └── Toolbar.tsx         # Barra superior: zoom, layout, settings
│   │   └── types/
│   │       └── index.ts            # Tipos compartilhados
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   └── build-webview.js            # Script para copiar dist do Vite para /out
├── .vscode/
│   ├── launch.json                 # F5 → Extension Development Host
│   └── tasks.json
├── .vscodeignore                   # O que não empacotar no VSIX
├── .gitignore
├── .eslintrc.json
├── .prettierrc.json
├── .nvmrc                          # "18"
├── package.json                    # Root package.json da extensão
├── tsconfig.json
├── esbuild.js                      # Build do extension host
├── icon.png                        # Ícone 128x128 pixel art (gerado via canvas script)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE                         # MIT
└── README.md
```

---

## 🏗️ ARQUITETURA DE DADOS

### Tipos principais (`webview-ui/src/types/index.ts`)

```typescript
export type AgentStatus =
  | 'idle'      // Parado, animação de respiração
  | 'walking'   // Se movendo para destino
  | 'typing'    // Na mesa, digitando (executando ferramenta)
  | 'reading'   // Na mesa, lendo (processando arquivo/doc)
  | 'thinking'  // Balão de pensamento animado (LLM processando)
  | 'waiting'   // Balão de diálogo "Aguardando..." (input do usuário)
  | 'done';     // Tarefa concluída — breve animação de comemoração

export type AgentProvider = 'claude-code' | 'antigravity' | 'copilot' | 'generic';

export interface Agent {
  id: string;
  name: string;           // Ex: "Claude #1", "Gemini #2"
  provider: AgentProvider;
  status: AgentStatus;
  characterIndex: number; // 0-5 (qual dos 6 sprites usar)
  deskIndex: number;      // Qual mesa está atribuída
  positionX: number;      // Posição atual no canvas (pixels)
  positionY: number;
  targetX: number;        // Destino para o pathfinding
  targetY: number;
  lastActivity: string;   // Descrição da última ação
  activeSince: number;    // timestamp ms
  toolCallCount: number;
  currentTool: string | null;
  speechBubble: {
    text: string;
    type: 'info' | 'warning' | 'done' | 'thinking';
    expiresAt: number;
  } | null;
}

export interface Desk {
  id: number;
  x: number;          // posição no grid do escritório
  y: number;
  label: string;
  assignedAgentId: string | null;
}

export interface OfficeState {
  agents: Record<string, Agent>;
  desks: Desk[];
  zoom: number;         // 1 | 2 | 3
  offsetX: number;      // scroll horizontal
  showSupervisorPanel: boolean;
  theme: 'dark' | 'light';
  locale: 'pt-BR' | 'en';
}
```

### Mensagens Extension Host ↔ Webview

```typescript
// Host → Webview
export type HostMessage =
  | { type: 'AGENT_SPAWNED'; agent: Agent }
  | { type: 'AGENT_STATUS_CHANGED'; agentId: string; status: AgentStatus; detail: string; tool: string | null }
  | { type: 'AGENT_REMOVED'; agentId: string }
  | { type: 'AGENT_SPEECH'; agentId: string; text: string; bubbleType: 'info' | 'warning' | 'done' | 'thinking' }
  | { type: 'INIT_STATE'; state: OfficeState };

// Webview → Host
export type WebviewMessage =
  | { type: 'READY' }
  | { type: 'ASSIGN_DESK'; agentId: string; deskId: number }
  | { type: 'SPAWN_AGENT'; provider: AgentProvider }
  | { type: 'SET_LOCALE'; locale: 'pt-BR' | 'en' }
  | { type: 'SET_ZOOM'; zoom: number };
```

---

## 🎨 SISTEMA DE SPRITES PIXEL ART

### Especificação dos sprites (`webview-ui/src/engine/CharacterSprites.ts`)

Cada personagem é desenhado **programaticamente** com Canvas 2D API. São **6 personagens únicos**, cada um com paleta de cores distinta. Dimensão base: **16×32 pixels** por frame, renderizados com `imageSmoothingEnabled = false` e escala 2x/3x.

**Animações por estado:**

| Estado | Frames | FPS | Descrição |
|--------|--------|-----|-----------|
| idle | 2 | 2 | Leve movimento de respiração (corpo sobe 1px) |
| walking | 4 | 8 | Alternância de pernas esquerda/direita |
| typing | 3 | 6 | Braços se movem para baixo e cima (teclar) |
| reading | 2 | 2 | Cabeça inclina levemente |
| thinking | 1 | — | Parado com `?` pulsando acima |
| waiting | 1 | — | Parado com `!` pulsando acima em amarelo |
| done | 4 | 8 | Animação de "jump" (personagem pula 3px) |

**Paletas dos 6 personagens (inspiradas na imagem de referência):**

```typescript
export const CHARACTER_PALETTES = [
  { skin: '#F5C5A3', hair: '#7B3F00', shirt: '#FFFFFF', pants: '#2D5BE3' }, // Personagem 0 — cabelo castanho, camisa branca
  { skin: '#F5C5A3', hair: '#D4A017', shirt: '#1A1A2E', pants: '#4A4A4A' }, // Personagem 1 — loiro, roupa escura
  { skin: '#8B5E3C', hair: '#1A0A00', shirt: '#FF6600', pants: '#333333' }, // Personagem 2 — pele morena, laranja
  { skin: '#F5C5A3', hair: '#1A1A1A', shirt: '#DC143C', pants: '#1A1A1A' }, // Personagem 3 — cabelo preto, vermelho
  { skin: '#F5C5A3', hair: '#C0C0C0', shirt: '#004B8D', pants: '#1A1A1A' }, // Personagem 4 — grisalho, azul Liberty
  { skin: '#F5D5B3', hair: '#7B3F00', shirt: '#F0F0F0', pants: '#8B8B8B' }, // Personagem 5 — moreno claro, neutro
] as const;
```

**Método de desenho de cada sprite:**
- Cabeça: retângulo 8×8px centralizado no topo do frame
- Cabelo: 3-4 pixels no topo da cabeça
- Olhos: 2 pixels 1px de altura na posição y=3 da cabeça
- Corpo: retângulo 8×10px abaixo da cabeça
- Braços: 2px × 8px em cada lado do corpo
- Pernas: 2 retângulos 4px × 10px abaixo do corpo
- Cada estado modifica a posição de pixels específicos (braços para typing, corpo para idle breathing, pernas para walking)

### Cenário do escritório (`webview-ui/src/engine/OfficeBackground.ts`)

Vista lateral (side-view). Canvas de **800×300px** base com scroll horizontal para acomodar mais mesas.

**Elementos a desenhar (todos via Canvas 2D):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  🪴              💡                    🪴                    💡      │  ← teto/parede (cor zinc-800)
│  ┌──┐ ┌──┐    ┌──┐ ┌──┐           ┌──┐ ┌──┐                        │  ← monitores no alto das mesas
│  │▓▓│ │▓▓│    │▓▓│ │▓▓│           │▓▓│ │▓▓│                        │
│  └──┘ └──┘    └──┘ └──┘           └──┘ └──┘                        │
│ ████ ████    ████ ████           ████ ████    [MESA DESK]           │  ← superfície das mesas
│  🧍   🧍      🧍   🧍              🧍   🧍                          │  ← personagens aqui
│═══════════════════════════════════════════════════════════════════  │  ← chão (zinc-700)
└─────────────────────────────────────────────────────────────────────┘
```

Cada "bay" de mesa ocupa 100px de largura. O escritório começa com 4 bays (400px) e expande automaticamente conforme agentes são adicionados.

Elementos pixel art do cenário (em paleta de cores da marca):
- Parede de fundo: `#27272a` (zinc-800)
- Chão: `#3f3f46` (zinc-700) com linha de moldura `#52525b`
- Mesa: `#a16207` (tampo) + `#78350f` (suporte)
- Monitor: `#0f172a` (moldura) + `#004B8D` (tela com brilho Liberty Blue)
- Planta: verde em pixel art (vaso terracota + folhas)
- Luminária: amarelo no teto

---

## 🔌 SISTEMA DE ADAPTERS

### Interface base (`src/adapters/IAgentAdapter.ts`)

```typescript
export interface AgentEvent {
  agentId: string;
  status: AgentStatus;
  detail: string;       // descrição legível ex: "Escrevendo src/App.tsx"
  tool: string | null;  // ex: "write_file", "bash", "read_file"
  timestamp: number;
}

export interface IAgentAdapter {
  readonly provider: AgentProvider;
  start(workspacePath: string): Promise<void>;
  stop(): void;
  onEvent(handler: (event: AgentEvent) => void): void;
  listActiveAgents(): string[];
}
```

### ClaudeCodeAdapter (`src/adapters/ClaudeCodeAdapter.ts`)

**Mecanismo:** Lê arquivos JSONL do Claude Code de forma não-invasiva (polling a cada 500ms).

**Caminho dos arquivos:** `~/.claude/projects/<hash_do_workspace>/<sessionId>.jsonl`

**Lógica de estado baseada em tool_use:**
```
tool_name === 'Write' || 'Edit' || 'MultiEdit'  → status: 'typing', tool: 'write_file'
tool_name === 'Read' || 'Glob' || 'Grep'        → status: 'reading', tool: 'read_file'
tool_name === 'Bash'                             → status: 'typing', tool: 'bash'
tool_name === 'Task' (subagent spawn)           → spawna novo agent card
record.type === 'assistant' sem tool_use         → status: 'thinking'
record.type === 'user' com role input_required   → status: 'waiting'
idle > 5s após último evento                     → status: 'idle'
```

**Detecção do hash do workspace:**
- Calcular SHA256 (ou ler diretório) de `~/.claude/projects/` e mapear para o workspace atual do VS Code

### AntigravityAdapter (`src/adapters/AntigravityAdapter.ts`)

**Mecanismo:** Intercepta saída do terminal do VS Code via `vscode.window.onDidWriteTerminalData`.

**Heurísticas para detecção de estado:**
```
Terminal output contém "Generating" || "Thinking"   → status: 'thinking'
Terminal output contém "Writing"  || "Editing"       → status: 'typing', tool: 'write_file'
Terminal output contém "Reading"  || "Searching"     → status: 'reading', tool: 'read_file'
Terminal output contém "Running"  || "Executing"     → status: 'typing', tool: 'bash'
Terminal output contém "Done" || "Complete"          → status: 'done' por 3s, depois 'idle'
Terminal output contém "?" || "input" (minúsculo)    → status: 'waiting'
```

### WebSocketAdapter (`src/adapters/WebSocketAdapter.ts`)

Servidor WebSocket em `ws://localhost:7891`. Permite que qualquer ferramenta externa envie eventos JSON no formato `AgentEvent`. Isso permite integração com Cursor, Copilot, ou qualquer outro agente via script.

**Payload de exemplo:**
```json
{
  "agentId": "meu-agente-1",
  "status": "typing",
  "detail": "Escrevendo componente React",
  "tool": "write_file"
}
```

---

## ⚙️ EXTENSION HOST

### `src/extension.ts`

```typescript
// Responsabilidades:
// 1. Registrar comandos VS Code
// 2. Instanciar PixelCrewPanel (WebviewPanel)
// 3. Instanciar AgentRegistry com todos os adapters
// 4. Orquestrar mensagens entre AgentRegistry → PixelCrewPanel → Webview

// Comandos a registrar:
// 'pixelcrew.openOffice'      — abre/foca o painel PixelCrew
// 'pixelcrew.spawnAgent'      — abre quick pick para escolher provider e spawna agente
// 'pixelcrew.toggleLocale'    — alterna PT-BR / EN
// 'pixelcrew.resetLayout'     — reseta disposição das mesas
```

### `src/PixelCrewPanel.ts`

```typescript
// WebviewPanel na aba inferior (ViewColumn.Beside ou panel area)
// Opções do webview:
//   enableScripts: true
//   localResourceRoots: [Uri.joinPath(extensionUri, 'out', 'webview')]
//   retainContextWhenHidden: true   ← mantém o game loop vivo
// 
// HTML gerado: carrega bundle do Vite em /out/webview/assets/
// CSP: default-src 'none'; script-src 'nonce-XXX'; style-src 'unsafe-inline'; img-src data:
```

### `src/AgentRegistry.ts`

```typescript
// - Mantém mapa de agentId → Agent
// - Instancia todos os adapters disponíveis
// - Emite eventos para o PixelCrewPanel quando estado muda
// - Auto-assign de mesa: round-robin nos slots disponíveis
// - Auto-remove agente se inativo por > 5 minutos sem eventos
```

---

## 🖼️ WEBVIEW UI

### Game Loop (`webview-ui/src/engine/GameLoop.ts`)

```typescript
// requestAnimationFrame com delta time
// 60 FPS target, com throttle para 30 FPS em background
// Responsável por:
// 1. Atualizar posições dos personagens (interpolação suave, velocidade 2px/frame)
// 2. Avançar frame de animação de cada personagem
// 3. Verificar expiração de speech bubbles
// 4. Chamar Renderer.draw() com o estado atual
```

### Renderer (`webview-ui/src/engine/Renderer.ts`)

```typescript
// 1. Limpa o canvas (clearRect)
// 2. Desenha OfficeBackground (cenário estático em offscreen canvas, renderizado 1x)
// 3. Para cada agent (ordenado por positionY para z-order correto):
//    a. Renderiza o sprite correto do personagem (CharacterSprites.draw)
//    b. Se status === 'thinking': desenha bolinha de "..." pulsando
//    c. Se status === 'waiting': desenha '!' amarelo pulsando
//    d. Se status === 'done': frame de celebração
// 4. Calcula offscreen canvas com zoom e offsetX antes de copiar para o canvas principal
```

### Pathfinding (`webview-ui/src/engine/Pathfinding.ts`)

```typescript
// BFS simples no grid do escritório
// Agentes só andam horizontalmente (side-view)
// Destinos: posição X da mesa atribuída
// Velocidade: 1.5px por frame de jogo
// Ao chegar: transição para animação de estado atual (typing/reading/etc)
```

### `webview-ui/src/App.tsx`

```typescript
// Layout:
// - Toolbar no topo (logo PixelCrew + zoom controls + locale toggle + settings)
// - OfficeCanvas ocupando a área central (flex-grow)
// - SupervisorPanel colapsável na direita (240px) com toggle
//
// Theme: dark (zinc-900 background), brand color Liberty Blue #004B8D
// Font: 'JetBrains Mono' ou fallback monospace (embutida via CSS @import)
```

### SupervisorPanel (`webview-ui/src/components/SupervisorPanel.tsx`)

```typescript
// Lista todos os agentes com:
// - Indicador de status colorido (dot animado)
// - Nome + provider (ícone)
// - Tempo ativo (ex: "2m 34s")
// - Última ação (truncada em 40 chars)
// - Contador de tool calls
// - Botão "Focus" para centralizar o canvas no agente
//
// Footer do painel: "PixelCrew v{version} • MIT License"
```

---

## 📦 CONFIGURAÇÃO DOS PACOTES

### `package.json` (root — extensão VS Code)

```json
{
  "name": "pixelcrew",
  "displayName": "PixelCrew",
  "description": "Veja seus agentes de IA trabalhando — em pixel art.",
  "version": "0.1.0",
  "publisher": "pixelcrew-hq",
  "engines": { "vscode": "^1.105.0" },
  "categories": ["Other", "Visualization"],
  "keywords": ["ai", "agents", "pixel-art", "claude", "copilot", "visualization"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      { "command": "pixelcrew.openOffice", "title": "PixelCrew: Abrir Escritório" },
      { "command": "pixelcrew.spawnAgent", "title": "PixelCrew: Adicionar Agente" },
      { "command": "pixelcrew.toggleLocale", "title": "PixelCrew: Alternar PT-BR/EN" },
      { "command": "pixelcrew.resetLayout", "title": "PixelCrew: Resetar Layout" }
    ],
    "configuration": {
      "title": "PixelCrew",
      "properties": {
        "pixelcrew.defaultProvider": {
          "type": "string",
          "enum": ["claude-code", "antigravity", "generic"],
          "default": "claude-code",
          "description": "Adapter padrão para novos agentes"
        },
        "pixelcrew.zoom": {
          "type": "number",
          "enum": [1, 2, 3],
          "default": 2,
          "description": "Zoom padrão do canvas"
        },
        "pixelcrew.locale": {
          "type": "string",
          "enum": ["pt-BR", "en"],
          "default": "pt-BR"
        },
        "pixelcrew.soundEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Som ao concluir tarefa"
        },
        "pixelcrew.websocketPort": {
          "type": "number",
          "default": 7891,
          "description": "Porta do WebSocket adapter genérico"
        }
      }
    },
    "menus": {
      "view/title": [
        {
          "command": "pixelcrew.spawnAgent",
          "when": "view == pixelcrew.officeView",
          "group": "navigation"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "npm run build:webview && node esbuild.js",
    "build:webview": "cd webview-ui && npm run build",
    "watch": "concurrently \"node esbuild.js --watch\" \"cd webview-ui && npm run dev\"",
    "package": "vsce package",
    "lint": "eslint src --ext ts"
  },
  "dependencies": {
    "ws": "^8.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.105.0",
    "@types/ws": "^8.5.10",
    "@vscode/vsce": "^2.24.0",
    "concurrently": "^8.2.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.4.0"
  }
}
```

### `webview-ui/package.json`

```json
{
  "name": "pixelcrew-webview",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

### `esbuild.js` (bundle do extension host)

```javascript
const esbuild = require('esbuild');
const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: 'node',
  outfile: 'out/extension.js',
  external: ['vscode'],
  logLevel: 'info',
});

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
```

### `webview-ui/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../out/webview',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[chunk].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

---

## 🔄 FLUXO DE DADOS COMPLETO

```
1. VS Code abre workspace
2. extension.ts.activate() é chamado
3. AgentRegistry instancia: ClaudeCodeAdapter + AntigravityAdapter + WebSocketAdapter
4. Todos os adapters.start(workspacePath) são chamados
5. ClaudeCodeAdapter começa polling dos JSONL
6. AntigravityAdapter registra listener em vscode.window.onDidWriteTerminalData
7. WebSocketAdapter abre servidor ws://localhost:7891

8. Usuário executa 'pixelcrew.openOffice'
9. PixelCrewPanel cria WebviewPanel com HTML que carrega o bundle React/Vite
10. Webview envia mensagem { type: 'READY' }
11. Extension responde com { type: 'INIT_STATE', state: officeState }
12. React hydrata o Zustand store com officeState
13. GameLoop.start() inicia requestAnimationFrame
14. Renderer.draw() chama OfficeBackground (renderizado 1x em offscreen canvas)
15. Canvas exibe o escritório vazio com 4 mesas

16. Adapter detecta atividade do Claude Code no JSONL
17. AgentRegistry cria/atualiza Agent object
18. Se agente novo: AGENT_SPAWNED → webview → Zustand adiciona agente → personagem aparece na entrada do escritório → pathfinding calcula rota para a mesa atribuída
19. Agent.status muda → AGENT_STATUS_CHANGED → Zustand atualiza → animação do sprite muda
20. Se status === 'waiting': speech bubble aparece em React (overlay sobre canvas)
21. Se status === 'done': 3s de animação de comemoração → volta para 'idle'
```

---

## 🌍 INTERNACIONALIZAÇÃO

Arquivo `webview-ui/src/i18n.ts`:

```typescript
export const i18n = {
  'pt-BR': {
    addAgent: 'Adicionar Agente',
    supervisorPanel: 'Painel Supervisor',
    status: {
      idle: 'Disponível',
      walking: 'Se movendo',
      typing: 'Programando',
      reading: 'Lendo',
      thinking: 'Processando',
      waiting: 'Aguardando input',
      done: 'Concluído!',
    },
    activeSince: 'Ativo há',
    toolCalls: 'chamadas de ferramenta',
    noAgents: 'Nenhum agente ativo. Use "Adicionar Agente" para começar.',
    focus: 'Focar',
    zoom: 'Zoom',
    settings: 'Configurações',
  },
  'en': {
    addAgent: 'Add Agent',
    supervisorPanel: 'Supervisor Panel',
    status: {
      idle: 'Available',
      walking: 'Moving',
      typing: 'Coding',
      reading: 'Reading',
      thinking: 'Processing',
      waiting: 'Awaiting input',
      done: 'Done!',
    },
    activeSince: 'Active for',
    toolCalls: 'tool calls',
    noAgents: 'No active agents. Use "Add Agent" to get started.',
    focus: 'Focus',
    zoom: 'Zoom',
    settings: 'Settings',
  },
} as const;
```

---

## 📋 FASES DE CONSTRUÇÃO

---

### FASE 1 — Scaffold e Infraestrutura
**Objetivo:** Repositório funcional com extensão VS Code básica abrindo webview em branco.

**Tarefas:**
1. Criar toda a estrutura de diretórios especificada acima
2. Criar `package.json` root com todos os campos corretos para publicação VS Code
3. Criar `webview-ui/package.json` e instalar dependências
4. Criar `tsconfig.json` e `webview-ui/vite.config.ts`
5. Criar `.vscode/launch.json` (F5 lança Extension Development Host)
6. Criar `.vscode/tasks.json` com task "npm: watch"
7. Criar `esbuild.js` 
8. Criar `src/extension.ts` com `activate()` que registra os 4 comandos e abre um WebviewPanel simples exibindo `<h1>PixelCrew Loading...</h1>`
9. Criar `webview-ui/src/main.tsx` e `App.tsx` minimalistas
10. Criar `webview-ui/index.html`
11. Criar `.gitignore`, `.prettierrc.json`, `.eslintrc.json`
12. Criar `LICENSE` (MIT, ano 2024, autor: "PixelCrew Contributors")
13. Executar `npm install` na raiz e em `webview-ui/`
14. Executar `npm run build` e confirmar que `out/extension.js` e `out/webview/assets/` são gerados sem erros

**✅ Critério de conclusão:** `npm run build` termina sem erros. Estrutura de diretórios criada. `out/extension.js` existe.

---

### FASE 2 — Sistema de Tipos e Store
**Objetivo:** Tipos TypeScript completos e Zustand store funcionando.

**Tarefas:**
1. Criar `webview-ui/src/types/index.ts` com todos os tipos definidos acima (AgentStatus, AgentProvider, Agent, Desk, OfficeState, HostMessage, WebviewMessage)
2. Criar `webview-ui/src/store/officeStore.ts` com Zustand:
   - Estado inicial com array de 4 mesas em posições X: [80, 200, 320, 440]
   - Actions: `spawnAgent`, `updateAgentStatus`, `removeAgent`, `assignDesk`, `setZoom`, `setLocale`, `toggleSupervisorPanel`
   - Selector hooks: `useAgents()`, `useDesks()`, `useZoom()`, `useLocale()`
3. Criar `webview-ui/src/vscodeApi.ts`:
   ```typescript
   const vscode = acquireVsCodeApi();
   export const postMessage = (msg: WebviewMessage) => vscode.postMessage(msg);
   export const getState = () => vscode.getState();
   export const setState = (state: any) => vscode.setState(state);
   ```
4. Criar `webview-ui/src/i18n.ts` com o objeto completo de traduções
5. Criar `webview-ui/src/App.tsx` que usa o store e renderiza estrutura de layout (Toolbar + Canvas area + SupervisorPanel placeholder)

**✅ Critério de conclusão:** TypeScript compila sem erros em `webview-ui/`. Store importável e com tipos corretos.

---

### FASE 3 — Sprites Pixel Art e Cenário
**Objetivo:** 6 personagens pixel art desenhados com Canvas 2D, cenário do escritório funcional.

**Tarefas:**
1. Criar `webview-ui/src/engine/CharacterSprites.ts`:
   - Definir `CHARACTER_PALETTES` com as 6 paletas especificadas
   - Implementar `drawCharacter(ctx, x, y, characterIndex, status, frame, scale)` que:
     - Usa `ctx.imageSmoothingEnabled = false`
     - Desenha cada parte do personagem (cabeça, cabelo, olhos, corpo, braços, pernas) com as cores da paleta
     - Ajusta posições dos pixels baseado no `status` e `frame` da animação
   - Implementar `getFrameCount(status): number` 
   - Implementar `getAnimationFPS(status): number`
2. Criar `webview-ui/src/engine/OfficeBackground.ts`:
   - Implementar `drawOffice(ctx, deskCount, zoom)` que:
     - Desenha fundo da parede (zinc-800 `#27272a`)
     - Desenha linha do teto
     - Para cada desk: mesa (tampo marrom + pé) + monitor (pixel art) + cadeira
     - Desenha chão (zinc-700 com borda)
     - Adiciona plantas decorativas a cada 2 mesas
     - Adiciona luminárias no teto
   - Implementar `getDeskPositionX(deskIndex): number` (retorna X onde o agente deve ficar quando na mesa)
3. Criar `webview-ui/src/engine/GameLoop.ts`:
   - Implementar `GameLoop` class com `start()`, `stop()`, `onTick(callback)`
   - Delta time calculation
   - Throttle para 30 FPS
4. Criar `webview-ui/src/engine/Renderer.ts`:
   - Implementar `render(canvas, agents, desks, zoom, offsetX)` 
   - Renderizar background em offscreen canvas (lazy, só quando desk count muda)
   - Renderizar cada agente com sprite correto
   - Adicionar leve shadow abaixo de cada personagem (efeito de chão)
5. Criar `webview-ui/src/components/OfficeCanvas.tsx`:
   - `<canvas>` element com ref
   - useEffect para iniciar GameLoop
   - Mensagem de estado vazio quando sem agentes

**✅ Critério de conclusão:** Canvas exibe cenário do escritório com ao menos 1 personagem animado de forma estática (sem movimento ainda). Pixels nítidos em escala 2x.

---

### FASE 4 — Pathfinding e Animações de Movimento
**Objetivo:** Personagens andam suavemente para suas mesas e mudam de animação baseado no status.

**Tarefas:**
1. Criar `webview-ui/src/engine/Pathfinding.ts`:
   - `getPath(fromX, toX): number[]` — retorna array de posições X intermediárias
   - Velocidade: 2px por frame de jogo (60fps = ~120px/s visual a zoom 2x)
2. Atualizar `GameLoop.ts` para mover agentes em direção ao seu `targetX` via interpolação:
   - Se `Math.abs(positionX - targetX) < 2`: chegou — status transition para estado atual
   - Enquanto em movimento: status interno de 'walking' override o status real para animar pernas
3. Atualizar `Renderer.ts` para:
   - Calcular frame atual baseado em `Date.now()` e `getAnimationFPS(status)`
   - Desenhar pensamento animado (`...` pulsando) quando status === 'thinking'
   - Desenhar `!` amarelo pulsando quando status === 'waiting'
   - Desenhar mini-balão verde quando status === 'done' por < 3s
4. Atualizar `officeStore.ts` para incluir `animationFrame` e `walkProgress` por agente
5. Testar com agentes mock: criar `webview-ui/src/devMocks.ts` com 3 agentes em estados diferentes para desenvolvimento sem a extensão real

**✅ Critério de conclusão:** Com mocks ativados, 3 personagens aparecem no canvas, andam para mesas diferentes, e animam corretamente (typing faz braços se mover, thinking mostra `...`, waiting mostra `!`).

---

### FASE 5 — Mensagens Extension Host ↔ Webview
**Objetivo:** Comunicação bidirecional funcionando entre extension e React.

**Tarefas:**
1. Atualizar `src/extension.ts`:
   - Ao receber `{ type: 'READY' }` da webview: enviar `INIT_STATE` com estado atual
   - Expor método `sendMessage(msg: HostMessage)` para outros módulos usarem
2. Criar `src/PixelCrewPanel.ts` completo:
   - `getOrCreate(extensionUri)` pattern (singleton)
   - Gerar HTML que carrega os assets do Vite de `out/webview/assets/`
   - Implementar nonce para CSP
   - Handler `onDidReceiveMessage` despacha para AgentRegistry
3. Atualizar `webview-ui/src/App.tsx`:
   - `useEffect` que envia `{ type: 'READY' }` ao montar
   - `window.addEventListener('message', handler)` para receber mensagens do host
   - Handler popula o store com dados recebidos
4. Testar fluxo completo: extension spawna agente mock → webview mostra personagem

**✅ Critério de conclusão:** Ao pressionar F5 (Extension Development Host), executar `pixelcrew.openOffice`, e depois `pixelcrew.spawnAgent` (escolhendo "Mock"), um personagem aparece no canvas da webview.

---

### FASE 6 — ClaudeCodeAdapter
**Objetivo:** Detecção real de atividade do Claude Code via JSONL.

**Tarefas:**
1. Criar `src/utils/pathUtils.ts`:
   - `getClaudeProjectsDir(): string` — retorna `~/.claude/projects/`
   - `findActiveSession(workspacePath): string | null` — encontra o JSONL mais recente do workspace
   - `hashWorkspacePath(absPath): string` — gera hash compatível com o Claude Code
2. Criar `src/adapters/ClaudeCodeAdapter.ts` completo:
   - Polling de 500ms com `setInterval`
   - Parser de JSONL linha a linha (tail dos últimos N bytes com `fs.read`)
   - Mapeamento de `tool_use.name` → `AgentStatus` conforme tabela da spec
   - Idle detection: se > 5s sem evento → emite status 'idle'
   - Multi-session: detecta múltiplos arquivos JSONL ativos (sub-agents)
3. Integrar ao `AgentRegistry.ts`:
   - Auto-start ao ativar extensão
   - Cada JSONL ativo = um agente único no registro
4. Criar `src/AgentRegistry.ts`:
   - `Map<agentId, Agent>` 
   - `onAgentEvent(event)` → atualiza mapa → notifica PixelCrewPanel

**✅ Critério de conclusão:** Com Claude Code rodando em um terminal no mesmo workspace, o personagem no canvas muda de animação em tempo real conforme o Claude escreve arquivos, executa bash, ou aguarda input.

---

### FASE 7 — AntigravityAdapter e WebSocketAdapter
**Objetivo:** Suporte a Antigravity/Gemini e adapter genérico.

**Tarefas:**
1. Criar `src/adapters/AntigravityAdapter.ts`:
   - Registrar `vscode.window.onDidWriteTerminalData`
   - Filtrar terminais com nome contendo "Antigravity" ou "Gemini" (case-insensitive)
   - Aplicar heurísticas de detecção de estado conforme especificado
   - Debounce de 200ms para evitar flicker de estado
2. Criar `src/adapters/WebSocketAdapter.ts`:
   - Servidor `ws` na porta configurada (default 7891)
   - Aceita payload JSON `AgentEvent`
   - Validação básica do schema recebido
   - Log no Output Channel do VS Code quando recebe evento
3. Criar VS Code Output Channel `"PixelCrew"` em `extension.ts` para debug
4. Atualizar `pixelcrew.spawnAgent` para mostrar Quick Pick com opções:
   - `$(robot) Claude Code` 
   - `$(sparkle) Antigravity / Gemini`
   - `$(plug) Generic WebSocket (porta 7891)`
   - `$(beaker) Demo (mock)`

**✅ Critério de conclusão:** Selecionando "Demo" em spawnAgent, personagem mock animado aparece imediatamente. WebSocket adapter inicializa sem erros (verificar Output Channel).

---

### FASE 8 — UI Completa (Toolbar + SupervisorPanel + SpeechBubbles)
**Objetivo:** Interface polished com todos os componentes de UI.

**Tarefas:**
1. Criar `webview-ui/src/components/Toolbar.tsx`:
   - Logo PixelCrew (pixel art inline SVG de 24x24px)
   - Botões de zoom: [1x] [2x] [3x]
   - Toggle PT-BR / EN
   - Botão "👁 Supervisor" para mostrar/ocultar painel lateral
   - Botão "＋ Agente" (dispara postMessage SPAWN_AGENT para o host)
   - Estilo: `bg-zinc-900 border-b border-zinc-700 h-10 flex items-center px-3 gap-2`
2. Criar `webview-ui/src/components/SupervisorPanel.tsx`:
   - Lista de AgentCard por agente ativo
   - Se vazio: mensagem `i18n.noAgents`
   - Largura: 240px, background zinc-950, borda esquerda Liberty Blue
   - Scrollable com overflow-y-auto
3. Criar `webview-ui/src/components/AgentCard.tsx`:
   - Dot de status animado (pulse verde=idle, amarelo=waiting, azul=typing, cinza=done)
   - Nome + provider badge
   - Última atividade truncada
   - "Ativo há: 2m 34s" atualizado a cada segundo
   - Tool calls count
   - Botão "Focus" (postMessage para webview centralizar no agente)
4. Criar overlay de SpeechBubble em React (posicionado via CSS absolute sobre o canvas):
   - Usar `getBoundingClientRect` do canvas para calcular posição
   - Mostrar por 4 segundos e sumir com fade-out
5. Adicionar áudio de notificação (Web Audio API, beep simples gerado programaticamente via OscillatorNode) quando status muda para 'done'

**✅ Critério de conclusão:** UI completa visualmente. Supervisor panel mostra 3 agentes mock com status distintos. Toolbar responde a cliques. SpeechBubble aparece em PT-BR quando agente fica 'waiting'.

---

### FASE 9 — Polimento e Persistência
**Objetivo:** Estado persistido, layout editor básico, qualidade de produção.

**Tarefas:**
1. Persistência via `vscode.globalState`:
   - Salvar: zoom, locale, showSupervisorPanel, desk assignments
   - Restaurar ao reabrir o painel
2. Persistência de layout das mesas via `vscode.workspaceState`:
   - Número de mesas (min 4, max 16)
   - Posição custom das mesas (se o usuário reorganizou)
3. Auto-adição de mesas: quando agente spawna e não tem mesa disponível, adicionar nova mesa automaticamente, expandir canvas width
4. Implementar `pixelcrew.resetLayout` que volta para 4 mesas padrão
5. Tratamento de erros:
   - Se JSONL não encontrado: Output Channel log, sem crash
   - Se WebSocket porta em uso: tentar porta +1, notificar usuário via `vscode.window.showWarningMessage`
6. `webview-ui/src/devMocks.ts`: remover mocks do build de produção (somente em `import.meta.env.DEV`)
7. Throttle dos re-renders: não mais que 1 update de status por agente a cada 100ms
8. Testar com `npm run package` que gera o `.vsix` sem erros

**✅ Critério de conclusão:** `npm run package` gera `pixelcrew-0.1.0.vsix` sem erros. Instalar o VSIX com `code --install-extension pixelcrew-0.1.0.vsix` e extensão abre funcionando.

---

### FASE 10 — Open Source Setup e Documentação
**Objetivo:** Repositório pronto para publicação no GitHub e VS Code Marketplace.

**Tarefas:**
1. Criar `README.md` completo com:
   - Banner (descrição pixel art em ASCII art no topo)
   - Badges: versão, installs, licença, stars
   - GIF placeholder (instruções para gravar depois)
   - Seção "Features" com emoji
   - Seção "Requisitos" (VS Code 1.105+, Claude Code CLI ou Antigravity)
   - Seção "Como Usar" com screenshots placeholders
   - Seção "Configurações" (tabela com todas as settings)
   - Seção "Adapter Genérico (WebSocket)" com exemplo de payload JSON
   - Seção "Contribuindo"
   - Seção "Roadmap" com checkbox list
   - Créditos (inspirado em pixel-agents e agent-office)
2. Criar `CHANGELOG.md` com `## [0.1.0] - 2024-06-XX`
3. Criar `CONTRIBUTING.md` com:
   - Como clonar e rodar em modo dev (F5)
   - Como adicionar novo adapter
   - Como adicionar novo personagem
   - Convenções de código
4. Criar `CODE_OF_CONDUCT.md` (Contributor Covenant padrão)
5. Criar `.github/workflows/ci.yml`:
   ```yaml
   # Triggers: push main, PR para main
   # Jobs: checkout, setup-node 18, npm ci, npm run build, npm run lint
   ```
6. Criar `.github/workflows/release.yml`:
   ```yaml
   # Trigger: push de tag v*.*.*
   # Jobs: build, npm run package, upload artifact VSIX, criar GitHub Release
   ```
7. Criar `.github/ISSUE_TEMPLATE/bug_report.md` e `feature_request.md`
8. Criar `.vscodeignore` (excluir: node_modules, src/, webview-ui/src/, webview-ui/node_modules/, *.ts, .github/)
9. Criar `icon.png` 128×128: script Node.js que usa `canvas` npm para desenhar um personagem pixel art em fundo Liberty Blue `#004B8D` e salvar como PNG

**✅ Critério de conclusão:** README.md legível e completo. `npm run package` gera VSIX < 5MB. CI workflow válido. Repositório pronto para `git push origin main` e publicação.

---

## 🧪 TESTES MANUAIS FINAIS

Após todas as fases, executar checklist:

- [ ] F5 lança Extension Development Host sem erros no Debug Console
- [ ] `pixelcrew.openOffice` abre painel na área inferior do VS Code
- [ ] Painel mostra escritório em pixel art com 4 mesas e chão visíveis
- [ ] `pixelcrew.spawnAgent` → "Demo" → personagem aparece e anda até mesa 1
- [ ] Segundo spawn → segundo personagem vai para mesa 2, com sprite diferente
- [ ] Status 'typing' → animação de digitação visível nos braços do personagem
- [ ] Status 'thinking' → `...` pulsando acima do personagem
- [ ] Status 'waiting' → `!` amarelo + texto "Aguardando input" no SupervisorPanel
- [ ] Status 'done' → personagem pula + beep sonoro + supervisor mostra "Concluído!"
- [ ] Zoom [1x] [2x] [3x] funcionam sem distorção (pixels nítidos)
- [ ] Toggle PT-BR/EN muda todos os textos da UI
- [ ] SupervisorPanel mostra tempo ativo atualizado a cada segundo
- [ ] `pixelcrew.resetLayout` limpa mesa assignments e volta para 4 mesas
- [ ] `npm run package` gera `.vsix` que instala no VS Code real
- [ ] WebSocket adapter: `wscat -c ws://localhost:7891` → enviar JSON de AgentEvent → personagem muda status

---

## 📌 NOTAS IMPORTANTES PARA O ANTIGRAVITY

1. **NÃO usar `serverTimestamp()` em arrays** — não aplicável aqui (sem Firestore), mas manter a regra de não usar APIs não disponíveis no ambiente de execução
2. **Canvas 2D puro** — não instalar Phaser, Pixi, ou outras game engines. Manter dependências mínimas
3. **Zero assets externos** — sprites e cenário 100% Canvas 2D. O VSIX deve ser autocontido
4. **`imageSmoothingEnabled = false`** em TODOS os canvas drawImage calls — obrigatório para pixel art nítido
5. **Testar no Extension Development Host** (F5) a cada fase, não apenas no final
6. **Escala de desenvolvimento**: zoom=2 é o default (canvas renderiza em 2x o tamanho base dos sprites)
7. **CSP do webview**: nunca usar `'unsafe-eval'`. Todo JavaScript deve estar no bundle. Nonces para scripts inline
8. **Cor brand principal**: Liberty Blue `#004B8D` para acentos, borders, badges de provider. Background: zinc-900/zinc-950

---

## 🎯 RESULTADO ESPERADO

Ao finalizar todas as 10 fases, o repositório `pixelcrew/` estará:

1. **Funcional** como extensão VS Code instalável via VSIX
2. **Integrado** com Claude Code via JSONL e com Antigravity via terminal output
3. **Aberto** para a comunidade via MIT, com adapters plugáveis para qualquer agente
4. **Distinto** visualmente (side-view, 6 personagens únicos, Supervisor Dashboard)
5. **Pronto** para publicação no VS Code Marketplace
6. **Documentado** para contribuições open source no GitHub

---

*Prompt criado para o Antigravity IDE — construção autônoma, sem interrupções.*  
*Stack: TypeScript + React 18 + Vite + Canvas 2D + VS Code Extension API*  
*Versão alvo: PixelCrew v0.1.0*
