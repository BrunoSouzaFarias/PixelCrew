import { Agent, getAgentLevelInfo } from '../types';

export class TileMapRenderer {
  public mapData: any = null;
  public images: Record<string, HTMLImageElement> = {};
  public loaded = false;
  private frameCounter = 0;

  // Local state for 2D visual interpolation
  private agentPos = new Map<string, { x: number, y: number, dir: number, mirror: boolean }>();

  constructor() {
    this.init();
  }

  public async loadMap(mapFilename: string = 'default-layout-1.json') {
    try {
      const response = await fetch(`game_assets/${mapFilename}`);
      this.mapData = await response.json();
      this.loaded = true;
    } catch (e) {
      console.error('Failed to load map data:', e);
    }
  }

  private async init() {
    try {
      await this.loadMap();
      
      const srcs: Record<string, string> = {
        floor_0: 'game_assets/floors/floor_0.png',
        floor_1: 'game_assets/floors/floor_7.png',
        floor_hacker_0: 'game_assets/floors/floor_2.png',
        floor_hacker_1: 'game_assets/floors/floor_8.png',
        wall_base: 'game_assets/walls/wall_0.png',
        
        desk_front: 'game_assets/furniture/DESK/DESK_FRONT.png',
        desk_side: 'game_assets/furniture/DESK/DESK_SIDE.png',
        pc_front_off: 'game_assets/furniture/PC/PC_FRONT_OFF.png',
        pc_front_on: 'game_assets/furniture/PC/PC_FRONT_ON_1.png',
        pc_side: 'game_assets/furniture/PC/PC_SIDE.png',
        sofa_side: 'game_assets/furniture/SOFA/SOFA_SIDE.png',
        sofa_back: 'game_assets/furniture/SOFA/SOFA_BACK.png',
        sofa_front: 'game_assets/furniture/SOFA/SOFA_FRONT.png',
        coffee_table: 'game_assets/furniture/COFFEE_TABLE/COFFEE_TABLE.png',
        plant: 'game_assets/furniture/PLANT/PLANT.png',
        hanging_plant: 'game_assets/furniture/HANGING_PLANT/HANGING_PLANT.png',
        bookshelf: 'game_assets/furniture/DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF.png'
      };

      for(let i=0; i<6; i++) {
        srcs[`char_${i}`] = `game_assets/characters/char_${i}.png`;
      }

      for (const [key, path] of Object.entries(srcs)) {
        const img = new Image();
        img.src = path;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        this.images[key] = img;
      }

      this.loaded = true;
    } catch (e) {
      console.error('Falha ao carregar mapa top-down', e);
    }
  }

  private drawSprite(ctx: CanvasRenderingContext2D, imgKey: string, x: number, y: number, zoom: number, mirror = false) {
    const img = this.images[imgKey];
    if (!img) return;
    
    ctx.save();
    if (mirror) {
      ctx.translate(x + img.width * zoom, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, img.width * zoom, img.height * zoom);
    } else {
      ctx.drawImage(img, x, y, img.width * zoom, img.height * zoom);
    }
    ctx.restore();
  }

  private drawCharacterSprite(ctx: CanvasRenderingContext2D, imgKey: string, frameX: number, frameY: number, dx: number, dy: number, zoom: number, mirror = false) {
    const img = this.images[imgKey];
    if (!img) return;
    const w = 16;
    const h = 32;

    ctx.save();
    if (mirror) {
      ctx.translate(dx + w * zoom, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, frameX * w, frameY * h, w, h, 0, 0, w * zoom, h * zoom);
    } else {
      ctx.drawImage(img, frameX * w, frameY * h, w, h, dx, dy, w * zoom, h * zoom);
    }
    ctx.restore();
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, zoom: number, agents: Agent[], theme: string = 'dark', panX: number = 0, panY: number = 0) {
    this.frameCounter++;
    if (!this.loaded || !this.mapData) {
      ctx.fillStyle = '#09090b'; // escuro
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      return;
    }

    const TILE_SIZE = 16; // CORRIGIDO PARA 16px!
    const cols = this.mapData.cols;
    const rows = this.mapData.rows;
    const s = TILE_SIZE * zoom;
    const mapW = cols * s;
    const mapH = rows * s;
    const offsetX = Math.floor((canvasWidth - mapW) / 2 + panX);
    const offsetY = Math.floor((canvasHeight - mapH) / 2 + panY);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Fundo base do canvas inteiro
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Não preenchemos um retângulo gigante com #3A3A5C. 
    // Isso deixará os blocos 255 totalmente transparentes (da cor do canvas #09090b),
    // removendo a "área cinza" que sobra no topo.

    // Grid de Tiles
    const tiles = this.mapData.tiles;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const t = tiles[idx];
        if (t === 255) {
          // ctx.fillStyle = 'rgba(255,255,255,0.02)';
          // ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
          continue;
        }
        
        const dx = offsetX + c * s;
        const dy = offsetY + r * s;
        
        const isHacker = theme === 'hacker-basement';
        if (isHacker) {
          // Custom Hacker Floor (Metal Grid)
          if (t === 0 || t === 7 || t === 1 || t === 9) {
            ctx.fillStyle = '#27272a'; // Base mais clara (antes #18181b)
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = '#3f3f46'; // Linha de grade mais clara
            ctx.lineWidth = 1 * zoom;
            ctx.strokeRect(dx, dy, s, s);
            
            // Adiciona um detalhe de junção nas pontas (parafusos)
            ctx.fillStyle = '#52525b';
            ctx.fillRect(dx + 2 * zoom, dy + 2 * zoom, 1 * zoom, 1 * zoom);
            ctx.fillRect(dx + s - 3 * zoom, dy + 2 * zoom, 1 * zoom, 1 * zoom);
            ctx.fillRect(dx + 2 * zoom, dy + s - 3 * zoom, 1 * zoom, 1 * zoom);
            ctx.fillRect(dx + s - 3 * zoom, dy + s - 3 * zoom, 1 * zoom, 1 * zoom);
          } else {
             this.drawSprite(ctx, 'wall_base', dx, dy, zoom);
          }
        } else {
          if (t === 0) { // FLOOR 0
            this.drawSprite(ctx, 'floor_0', dx, dy, zoom);
          } else if (t === 7 || t === 1 || t === 9) { // CARPETS AND OTHER FLOORS
            this.drawSprite(ctx, 'floor_1', dx, dy, zoom);
          } else { // WALL BASE
            this.drawSprite(ctx, 'wall_base', dx, dy, zoom);
          }
        }
      }
    }

    // Array for Z-sorting (drawables)
    interface ZDrawable {
      zY: number;
      draw: () => void;
    }
    const drawables: ZDrawable[] = [];

    // Furniture
    if (this.mapData.furniture) {
      for (const f of this.mapData.furniture) {
        const dx = offsetX + f.col * s;
        const dy = offsetY + f.row * s;
        const zY = f.row * s; // simplificação de z-sort
        
        let imgKey = null;
        let mirror = false;
        if (f.type === 'TABLE_FRONT' || f.type === 'DESK_FRONT') imgKey = 'desk_front';
        if (f.type === 'DESK_SIDE') imgKey = 'desk_side';
        if (f.type === 'DESK_SIDE:left') { imgKey = 'desk_side'; mirror = true; }
        if (f.type === 'PC_FRONT_OFF') imgKey = 'pc_front_off';
        if (f.type === 'PC_FRONT_ON') imgKey = 'pc_front_on';
        if (f.type === 'PC_SIDE') imgKey = 'pc_side';
        if (f.type === 'PC_SIDE:left') { imgKey = 'pc_side'; mirror = true; }
        if (f.type === 'SOFA_SIDE') imgKey = 'sofa_side';
        if (f.type === 'SOFA_SIDE:left') { imgKey = 'sofa_side'; mirror = true; }
        if (f.type === 'SOFA_BACK') imgKey = 'sofa_back';
        if (f.type === 'SOFA_FRONT') imgKey = 'sofa_front';
        if (f.type === 'COFFEE_TABLE') imgKey = 'coffee_table';
        if (f.type === 'PLANT' || f.type === 'PLANT_2') imgKey = 'plant';
        if (f.type === 'HANGING_PLANT') imgKey = 'hanging_plant';
        if (f.type === 'DOUBLE_BOOKSHELF') imgKey = 'bookshelf';

        if (imgKey) {
          drawables.push({
            zY: zY,
            draw: () => this.drawSprite(ctx, imgKey, dx, dy, zoom, mirror)
          });
        }
      }
    }

    // Characters
    // Mapear cadeiras de trabalho (PCs)
    const workSeats: {col: number, row: number, dir: number, mirror: boolean}[] = [];
    if (this.mapData.furniture) {
      this.mapData.furniture.forEach((f: any) => {
        if (f.type.includes('PC_FRONT')) workSeats.push({ col: f.col, row: f.row + 1, dir: 1, mirror: false }); // Frente pro PC (senta embaixo virado pra cima)
        if (f.type === 'PC_SIDE') workSeats.push({ col: f.col - 1, row: f.row, dir: 2, mirror: false }); // PC na direita, senta na esquerda virado pra direita
        if (f.type === 'PC_SIDE:left') workSeats.push({ col: f.col + 1, row: f.row, dir: 2, mirror: true }); // PC na esquerda, senta na direita virado pra esquerda
      });
    }

    // Mapear assentos de descanso (Sofás e Bancos)
    const restSeats: {col: number, row: number, dir: number, mirror: boolean}[] = [];
    if (this.mapData.furniture) {
      this.mapData.furniture.forEach((f: any) => {
        if (f.type === 'SOFA_FRONT' || f.type.includes('BENCH')) restSeats.push({ col: f.col, row: f.row, dir: 0, mirror: false }); // Virado pra baixo
        if (f.type === 'SOFA_BACK') restSeats.push({ col: f.col, row: f.row, dir: 1, mirror: false }); // Virado pra cima
        if (f.type === 'SOFA_SIDE') restSeats.push({ col: f.col, row: f.row, dir: 2, mirror: false }); // Virado pra direita
        if (f.type === 'SOFA_SIDE:left') restSeats.push({ col: f.col, row: f.row, dir: 2, mirror: true }); // Virado pra esquerda
      });
    }

    // Se não encontrou nenhum no mapa, adiciona um default
    if (workSeats.length === 0) workSeats.push({ col: 14, row: 13, dir: 1, mirror: false });
    if (restSeats.length === 0) restSeats.push({ col: 14, row: 13, dir: 0, mirror: false });

    // Filtrar apenas os agentes que estão trabalhando
    let workingIdx = 0;

    agents.forEach((agent, i) => {
      let targetSeat;
      const isWorking = agent.status === 'typing' || agent.status === 'reading' || agent.status === 'thinking';
      
      let pos = this.agentPos.get(agent.id);
      if (!pos) {
        // Inicializa no meio
        pos = { x: offsetX + 14 * s, y: offsetY + 13 * s, dir: 0, mirror: false, idleFrames: 0, targetCol: 14, targetRow: 13, isRestingAtSofa: false };
        this.agentPos.set(agent.id, pos);
      }

      if (isWorking) {
        targetSeat = workSeats[workingIdx % workSeats.length];
        workingIdx++;
        pos.targetCol = targetSeat.col;
        pos.targetRow = targetSeat.row;
        pos.targetDir = targetSeat.dir;
        pos.targetMirror = targetSeat.mirror;
        pos.isRestingAtSofa = false;
      } else {
        // State Machine para WANDERING
        if (pos.idleFrames && pos.idleFrames > 0) {
          pos.idleFrames--;
        } else {
          // Decidir novo alvo!
          // 40% de chance de ir pro sofá, 60% de chance de andar aleatoriamente pelo chão
          const isGoingToSofa = Math.random() < 0.4;
          
          if (isGoingToSofa && restSeats.length > 0) {
            const seat = restSeats[Math.floor(Math.random() * restSeats.length)];
            pos.targetCol = seat.col;
            pos.targetRow = seat.row;
            pos.targetDir = seat.dir;
            pos.targetMirror = seat.mirror;
            pos.isRestingAtSofa = true;
            pos.idleFrames = 300 + Math.random() * 300; // Senta por 5 a 10 segundos (a 60fps)
          } else {
            // Acha todos os tiles de chão válidos
            const walkable: {c: number, r: number}[] = [];
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const t = tiles[r * cols + c];
                if (t === 0 || t === 7 || t === 1 || t === 9) {
                  walkable.push({c, r});
                }
              }
            }
            if (walkable.length > 0) {
              const dest = walkable[Math.floor(Math.random() * walkable.length)];
              pos.targetCol = dest.c;
              pos.targetRow = dest.r;
              pos.targetDir = 0; // quando chegar, olha pra baixo
              pos.targetMirror = false;
              pos.isRestingAtSofa = false;
              pos.idleFrames = 100 + Math.random() * 200; // Fica parado de 1.5 a 5 segundos
            }
          }
        }
      }

      const tx = offsetX + (pos.targetCol ?? 14) * s; 
      const ty = offsetY + (pos.targetRow ?? 13) * s - 16 * zoom;

      // Visual Lerp
      const speed = 0.8 * zoom; // Andar mais calmo
      const dx = tx - pos.x;
      const dy = ty - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let isWalking = false;

      if (dist > speed) {
        isWalking = true;
        pos.x += (dx / dist) * speed;
        pos.y += (dy / dist) * speed;
        
        // Face correct direction when walking
        if (Math.abs(dx) > Math.abs(dy)) {
          pos.dir = 2; // Right/Left
          pos.mirror = dx < 0;
        } else {
          pos.dir = dy > 0 ? 0 : 1; // Down / Up
          pos.mirror = false;
        }
      } else {
        pos.x = tx;
        pos.y = ty;
        if (pos.targetDir !== undefined) pos.dir = pos.targetDir;
        if (pos.targetMirror !== undefined) pos.mirror = pos.targetMirror;
      }

      let actionCol = 0; // default idle
      if (isWalking) {
        const walkCycle = [0, 1, 2, 1];
        const cycleIdx = Math.floor(this.frameCounter / 15) % walkCycle.length;
        actionCol = walkCycle[cycleIdx];
      } else if (isWorking) {
        actionCol = agent.status === 'reading' ? 5 : 3;
        if (Math.floor(this.frameCounter / 15) % 2 === 0) actionCol += 1;
      } else {
        actionCol = 0; // Idle parado
      }

      drawables.push({
        zY: pos.y + 32 * zoom, // Ajusta Z-Index baseado nos pés do boneco
        draw: () => {
          this.drawCharacterSprite(ctx, `char_${agent.characterIndex % 6}`, actionCol, pos.dir, pos.x, pos.y, zoom, pos.mirror);

          // DRAW ACCESSORY BASED ON LEVEL
          const levelInfo = getAgentLevelInfo(agent.toolCallCount || 0);
          
          if (levelInfo.accessory === 'glasses') {
            if (pos.dir === 0) { // Looking Down
              ctx.save();
              ctx.fillStyle = '#09090b';
              ctx.fillRect(pos.x + 4 * zoom, pos.y + 11 * zoom, 3 * zoom, 2 * zoom);
              ctx.fillRect(pos.x + 9 * zoom, pos.y + 11 * zoom, 3 * zoom, 2 * zoom);
              ctx.fillRect(pos.x + 7 * zoom, pos.y + 11 * zoom, 2 * zoom, 1 * zoom);
              ctx.restore();
            } else if (pos.dir === 2) { // Looking Side
              ctx.save();
              ctx.fillStyle = '#09090b';
              if (!pos.mirror) { // Facing Right
                ctx.fillRect(pos.x + 9 * zoom, pos.y + 11 * zoom, 4 * zoom, 2 * zoom);
                ctx.fillRect(pos.x + 5 * zoom, pos.y + 11 * zoom, 4 * zoom, 1 * zoom); // temple
              } else { // Facing Left
                ctx.fillRect(pos.x + 3 * zoom, pos.y + 11 * zoom, 4 * zoom, 2 * zoom);
                ctx.fillRect(pos.x + 7 * zoom, pos.y + 11 * zoom, 4 * zoom, 1 * zoom); // temple
              }
              ctx.restore();
            }
          } else if (levelInfo.accessory === 'headphones') {
            ctx.save();
            ctx.fillStyle = '#2563eb'; // blue
            if (pos.dir === 0 || pos.dir === 1) { // Down or Up
              ctx.fillRect(pos.x + 1 * zoom, pos.y + 8 * zoom, 2 * zoom, 4 * zoom); // left ear
              ctx.fillRect(pos.x + 13 * zoom, pos.y + 8 * zoom, 2 * zoom, 4 * zoom); // right ear
              ctx.fillRect(pos.x + 2 * zoom, pos.y + 5 * zoom, 12 * zoom, 1.5 * zoom); // top band
            } else if (pos.dir === 2) { // Side
              ctx.fillRect(pos.x + 6.5 * zoom, pos.y + 8 * zoom, 3 * zoom, 4 * zoom);
              ctx.fillRect(pos.x + 7.5 * zoom, pos.y + 5 * zoom, 1 * zoom, 3 * zoom);
            }
            ctx.restore();
          } else if (levelInfo.accessory === 'crown') {
            ctx.save();
            ctx.fillStyle = '#d97706'; // gold
            ctx.beginPath();
            // Crown base
            ctx.fillRect(pos.x + 4 * zoom, pos.y + 2 * zoom, 8 * zoom, 1.5 * zoom);
            // Left peak
            ctx.fillRect(pos.x + 4 * zoom, pos.y, 1.5 * zoom, 2 * zoom);
            // Middle peak
            ctx.fillRect(pos.x + 7 * zoom, pos.y, 2 * zoom, 2 * zoom);
            // Right peak
            ctx.fillRect(pos.x + 10.5 * zoom, pos.y, 1.5 * zoom, 2 * zoom);
            
            // Jewel
            ctx.fillStyle = '#ef4444'; // ruby red
            ctx.fillRect(pos.x + 7.5 * zoom, pos.y + 1 * zoom, 1 * zoom, 1 * zoom);
            ctx.restore();
          }
          
          // PROP: Café se estiver no sofá e idle
          if (!isWalking && !isWorking && pos.isRestingAtSofa) {
            ctx.fillStyle = '#f5f5f4'; // caneca branca
            // Desenha perto da mão do personagem
            const mugX = pos.x + 10 * zoom;
            const mugY = pos.y + 16 * zoom;
            ctx.fillRect(mugX, mugY, 3 * zoom, 4 * zoom);
            ctx.fillStyle = '#78350f'; // café escuro dentro
            ctx.fillRect(mugX + 0.5 * zoom, mugY, 2 * zoom, 1 * zoom);
          }
          
          // EFEITO MATRIX: Chuva de código na tela do PC
          if (isWorking && pos.dir === 1 && !isWalking) {
            // Desenhar partículas Matrix em cima da mesa do PC (acima do personagem)
            const pcScreenX = pos.x + 2 * zoom;
            const pcScreenY = pos.y - 12 * zoom; // Posição aproximada do monitor
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(pcScreenX, pcScreenY, 12 * zoom, 8 * zoom);
            
            ctx.fillStyle = '#22c55e'; // Verde Matrix
            ctx.font = `${4 * zoom}px monospace`;
            const numDrops = 3;
            for(let d = 0; d < numDrops; d++) {
              const dropY = ((this.frameCounter * (1 + d * 0.5)) % 10) * zoom;
              const dropX = d * 4 * zoom;
              if (dropY < 8 * zoom) {
                 const char = String.fromCharCode(0x30A0 + Math.random() * 96); // Katakana aleatório
                 ctx.fillText(char, pcScreenX + dropX, pcScreenY + dropY);
              }
            }
            ctx.restore();
          }

          // SPEECH BUBBLE
          let bubbleText: string | null = null;
          let bubbleType = 'info';

          if (agent.speechBubble && agent.speechBubble.expiresAt > Date.now()) {
            bubbleText = agent.speechBubble.text;
            bubbleType = agent.speechBubble.type;
          } else if (agent.status !== 'idle') {
            bubbleText = agent.lastActivity || 'Trabalhando...';
          }

          if (bubbleText) {
            ctx.save();
            ctx.font = `bold ${8 * zoom}px sans-serif`;
            const textWidth = ctx.measureText(bubbleText).width;
            const padding = 4 * zoom;
            const bubbleW = textWidth + padding * 2;
            const bubbleH = 14 * zoom;
            const bubbleX = pos.x + 8 * zoom - bubbleW / 2;
            const bubbleY = pos.y - bubbleH - 4 * zoom; // Acima da cabeça

            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.roundRect(bubbleX + 2, bubbleY + 2, bubbleW, bubbleH, 4 * zoom);
            ctx.fill();

            // Cores baseadas no tipo de balão
            let bgColor = 'white';
            let textColor = '#18181b';
            let strokeColor = '#e4e4e7';

            if (bubbleType === 'thinking') {
              bgColor = '#1e1b4b'; // dark blue/indigo
              textColor = '#e0e7ff';
              strokeColor = '#312e81';
            } else if (bubbleType === 'warning') {
              bgColor = '#7f1d1d'; // dark red
              textColor = '#fee2e2';
              strokeColor = '#991b1b';
            } else if (bubbleType === 'done') {
              bgColor = '#064e3b'; // dark green
              textColor = '#d1fae5';
              strokeColor = '#065f46';
            }

            // Fundo
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 4 * zoom);
            ctx.fill();
            
            // Triângulo apontando pro boneco
            ctx.beginPath();
            ctx.moveTo(bubbleX + bubbleW / 2 - 2 * zoom, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + bubbleW / 2 + 2 * zoom, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + bubbleW / 2, bubbleY + bubbleH + 3 * zoom);
            ctx.fill();

            // Borda
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1 * zoom;
            ctx.stroke();

            // Texto
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bubbleText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
            ctx.restore();
          }

          // NOME DO AGENTE (abaixo do personagem)
          ctx.save();
          ctx.font = `bold ${5 * zoom}px sans-serif`;
          ctx.fillStyle = '#f4f4f5';
          ctx.strokeStyle = '#000000'; // <- adicionado
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          // Borda/Sombra no texto para garantir legibilidade
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 3 * zoom;
          ctx.lineWidth = 2;
          ctx.strokeText(agent.name, pos.x + 8 * zoom, pos.y + 34 * zoom);
          ctx.fillText(agent.name, pos.x + 8 * zoom, pos.y + 34 * zoom);
          ctx.restore();
        }
      });
    });

    // Z-Sort and Render
    drawables.sort((a, b) => a.zY - b.zY);
    for (const d of drawables) {
      d.draw();
    }

    // Lighting System
    if (theme === 'default-layout-1' || theme === 'light') {
      // Light theme tint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      // Dark or Hacker Basement
      const isHacker = theme === 'hacker-basement';
      ctx.fillStyle = isHacker ? 'rgba(5, 20, 10, 0.45)' : 'rgba(9, 9, 11, 0.55)'; // Escurece menos no hacker para ver o chão
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Desenha luzes perto de PCs ligados
      ctx.globalCompositeOperation = 'lighter';
      agents.forEach((agent) => {
        const isWorking = agent.status === 'typing' || agent.status === 'reading' || agent.status === 'thinking';
        if (isWorking) {
          const pos = this.agentPos.get(agent.id);
          if (pos) { 
            const dx = pos.targetCol! * s + offsetX + s/2;
            const dy = pos.targetRow! * s + offsetY - s/2;
            const gradient = ctx.createRadialGradient(dx, dy, 0, dx, dy, 80 * zoom);
            
            if (isHacker) {
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)'); // Verde Matrix
            } else {
              gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // Azulzinho de tela
            }
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(dx, dy, 80 * zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
