import { Agent, getAgentLevelInfo } from '../types';
import { useOfficeStore } from '../store/officeStore';

export class TileMapRenderer {
  public mapData: any = null;
  public images: Record<string, HTMLImageElement> = {};
  public loaded = false;
  private frameCounter = 0;

  // Local state for 2D visual interpolation
  private agentPos = new Map<string, { x: number, y: number, dir: number, mirror: boolean, idleFrames?: number, targetCol?: number, targetRow?: number, targetDir?: number, targetMirror?: boolean, isRestingAtSofa?: boolean }>();

  constructor() {
    this.init();
  }

  public async loadMap(mapFilename: string = 'default-layout-1.json') {
    try {
      const state = useOfficeStore.getState();
      const response = await fetch(`game_assets/${mapFilename}`);
      const mapJson = await response.json();
      
      // Se já temos layouts customizados persistidos no VS Code backend, aplica-os
      const currentTheme = mapFilename.replace('.json', '');
      const customLayout = state.customLayouts?.[currentTheme];
      if (customLayout) {
        mapJson.furniture = customLayout;
      }
      
      useOfficeStore.setState({ mapData: mapJson });
      this.mapData = mapJson;
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

  private drawPet(ctx: CanvasRenderingContext2D, pet: any, zoom: number) {
    ctx.save();
    
    const px = pet.x;
    const py = pet.y;
    
    // Gira se espelhado
    if (pet.mirror) {
      ctx.translate(px + 12 * zoom, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }
    
    if (pet.type === 'cat') {
      // Gato Laranja 🐱
      ctx.fillStyle = '#f97316';
      // Corpo
      ctx.fillRect(2 * zoom, 8 * zoom, 8 * zoom, 5 * zoom);
      // Cabeça
      ctx.fillRect(6 * zoom, 4 * zoom, 5 * zoom, 5 * zoom);
      // Orelhas
      ctx.fillRect(6 * zoom, 2 * zoom, 1 * zoom, 2 * zoom);
      ctx.fillRect(10 * zoom, 2 * zoom, 1 * zoom, 2 * zoom);
      // Rabo
      ctx.fillRect(0 * zoom, 5 * zoom, 2 * zoom, 4 * zoom);
      // Olhos (verdes)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(9 * zoom, 5 * zoom, 1 * zoom, 1 * zoom);
      // Patas
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(3 * zoom, 13 * zoom, 1 * zoom, 1 * zoom);
      ctx.fillRect(5 * zoom, 13 * zoom, 1 * zoom, 1 * zoom);
      ctx.fillRect(7 * zoom, 13 * zoom, 1 * zoom, 1 * zoom);
      ctx.fillRect(9 * zoom, 13 * zoom, 1 * zoom, 1 * zoom);
    } else {
      // Cachorro Marrom 🐶
      ctx.fillStyle = '#a16207';
      // Corpo
      ctx.fillRect(1 * zoom, 7 * zoom, 9 * zoom, 6 * zoom);
      // Cabeça
      ctx.fillRect(7 * zoom, 3 * zoom, 5 * zoom, 5 * zoom);
      // Orelhas caídas
      ctx.fillStyle = '#713f12';
      ctx.fillRect(6 * zoom, 4 * zoom, 2 * zoom, 4 * zoom);
      // Rabo
      ctx.fillRect(0 * zoom, 5 * zoom, 1 * zoom, 3 * zoom);
      // Olhos
      ctx.fillStyle = '#000000';
      ctx.fillRect(10 * zoom, 4 * zoom, 1 * zoom, 1 * zoom);
      // Patas
      ctx.fillStyle = '#713f12';
      ctx.fillRect(2 * zoom, 13 * zoom, 2 * zoom, 1 * zoom);
      ctx.fillRect(7 * zoom, 13 * zoom, 2 * zoom, 1 * zoom);
    }
    
    ctx.restore();
    
    // Nome do pet flutuando
    ctx.save();
    ctx.font = `bold ${5 * zoom}px sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2 * zoom;
    ctx.fillText(pet.name, pet.x + 6 * zoom, pet.y - 2 * zoom);
    ctx.restore();
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number,
    agents: Agent[],
    theme: string = 'dark',
    panX: number = 0,
    panY: number = 0
  ) {
    this.frameCounter++;
    
    const state = useOfficeStore.getState();
    this.mapData = state.mapData;

    if (!this.loaded || !this.mapData) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      return;
    }

    // Coleta coordenadas de todos os móveis sólidos (bloqueados)
    const solidFurnitureTiles = new Set<string>();
    if (this.mapData.furniture) {
      this.mapData.furniture.forEach((f: any) => {
        const type = f.type || '';
        const isSeat = type.includes('SOFA') || type.includes('BENCH') || type.includes('CHAIR') || type.includes('CUSHION');
        if (!isSeat) {
          solidFurnitureTiles.add(`${f.col},${f.row}`);
        }
      });
    }

    const TILE_SIZE = 16;
    const cols = this.mapData.cols;
    const rows = this.mapData.rows;
    const s = TILE_SIZE * zoom;
    const mapW = cols * s;
    const mapH = rows * s;
    const offsetX = Math.floor((canvasWidth - mapW) / 2 + panX);
    const offsetY = Math.floor((canvasHeight - mapH) / 2 + panY);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Grid de Tiles
    const tiles = this.mapData.tiles;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const t = tiles[idx];
        if (t === 255) continue;
        
        const dx = offsetX + c * s;
        const dy = offsetY + r * s;
        
        const isHacker = theme === 'hacker-basement';
        if (isHacker) {
          if (t === 0 || t === 7 || t === 1 || t === 9) {
            // Piso Hacker Cyberpunk (grade preta com borda neon verde brilhante)
            ctx.fillStyle = '#050b07';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, s, s);
            
            // Detalhe de placa metálica
            ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
            ctx.fillRect(dx + 2 * zoom, dy + 2 * zoom, 1 * zoom, 1 * zoom);
            ctx.fillRect(dx + s - 3 * zoom, dy + s - 3 * zoom, 1 * zoom, 1 * zoom);
          } else {
            // Parede Hacker (Preta com neon verde brilhante no topo)
            ctx.fillStyle = '#020617';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx + s, dy);
            ctx.stroke();
          }
        } else {
          if (t === 7) {
            // Chão de Madeira/Bege Vivo
            ctx.fillStyle = '#ebd5b3';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = '#cda87b';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, s, s);
          } else if (t === 1) {
            // Carpete Azul Vivo
            ctx.fillStyle = '#3182ce';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = '#2b6cb0';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, s, s);
          } else if (t === 9) {
            // Tabuleiro de Xadrez (Preto e Branco)
            const isWhite = (r + c) % 2 === 0;
            ctx.fillStyle = isWhite ? '#f7fafc' : '#2d3748';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = isWhite ? '#cbd5e1' : '#1a202c';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(dx, dy, s, s);
          } else if (t === 0) {
            // Corredor (Cinza Escuro com linhas)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(dx, dy, s, s);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, s, s);
          } else {
            // Parede escura (Delineando as salas)
            ctx.fillStyle = '#111827';
            ctx.fillRect(dx, dy, s, s);
            
            // Bordas superiores brilhantes para dar profundidade
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx + s, dy);
            ctx.stroke();
          }
        }
      }
    }

    // Desenhar Grid de Linhas no Modo Decoração
    if (state.isDecorationMode) {
      ctx.save();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + r * s);
        ctx.lineTo(offsetX + cols * s, offsetY + r * s);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + c * s, offsetY);
        ctx.lineTo(offsetX + c * s, offsetY + rows * s);
        ctx.stroke();
      }
      ctx.restore();
    }

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
        const zY = f.row * s;
        
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
            draw: () => {
              this.drawSprite(ctx, imgKey, dx, dy, zoom, mirror);
              
              // Se selecionado na decoração, desenha contorno neon brilhante
              if (state.isDecorationMode && state.selectedFurnitureId === f.uid) {
                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = 10 * zoom;
                ctx.lineWidth = 2 * zoom;
                ctx.strokeRect(dx - 1, dy - 1, s + 2, s + 2);
                ctx.restore();
              }
            }
          });
        }
      }
    }

    // Assentos de PCs
    const workSeats: {col: number, row: number, dir: number, mirror: boolean}[] = [];
    if (this.mapData.furniture) {
      this.mapData.furniture.forEach((f: any) => {
        if (f.type.includes('PC_FRONT')) workSeats.push({ col: f.col, row: f.row + 1, dir: 1, mirror: false });
        if (f.type === 'PC_SIDE') workSeats.push({ col: f.col - 1, row: f.row, dir: 2, mirror: false });
        if (f.type === 'PC_SIDE:left') workSeats.push({ col: f.col + 1, row: f.row, dir: 2, mirror: true });
      });
    }

    // Assentos de Sofás
    const restSeats: {col: number, row: number, dir: number, mirror: boolean}[] = [];
    if (this.mapData.furniture) {
      this.mapData.furniture.forEach((f: any) => {
        if (f.type === 'SOFA_FRONT' || f.type.includes('BENCH')) restSeats.push({ col: f.col, row: f.row, dir: 0, mirror: false });
        if (f.type === 'SOFA_BACK') restSeats.push({ col: f.col, row: f.row, dir: 1, mirror: false });
        if (f.type === 'SOFA_SIDE') restSeats.push({ col: f.col, row: f.row, dir: 2, mirror: false });
        if (f.type === 'SOFA_SIDE:left') restSeats.push({ col: f.col, row: f.row, dir: 2, mirror: true });
      });
    }

    if (workSeats.length === 0) workSeats.push({ col: 14, row: 13, dir: 1, mirror: false });
    if (restSeats.length === 0) restSeats.push({ col: 14, row: 13, dir: 0, mirror: false });

    let workingIdx = 0;

    // Lógica e Desenho dos Agentes
    agents.forEach((agent, i) => {
      let targetSeat;
      const isWorking = agent.status === 'typing' || agent.status === 'reading' || agent.status === 'thinking';
      
      let pos = this.agentPos.get(agent.id);
      if (!pos) {
        pos = { x: offsetX + 14 * s, y: offsetY + 13 * s, dir: 0, mirror: false, idleFrames: 0, targetCol: 14, targetRow: 13, isRestingAtSofa: false };
        this.agentPos.set(agent.id, pos);
      }

      if (state.isPartyMode) {
        // Na festa de Commit, todos os agentes vão para a área central da sala
        pos.targetCol = 14 + (i % 3) - 1;
        pos.targetRow = 15 + Math.floor(i / 3);
        pos.targetDir = 0;
        pos.targetMirror = false;
        pos.isRestingAtSofa = false;
      } else if (isWorking) {
        targetSeat = workSeats[workingIdx % workSeats.length];
        workingIdx++;
        pos.targetCol = targetSeat.col;
        pos.targetRow = targetSeat.row;
        pos.targetDir = targetSeat.dir;
        pos.targetMirror = targetSeat.mirror;
        pos.isRestingAtSofa = false;
      } else {
        // Movimentação Wandering / Interação com Pet
        if (pos.idleFrames && pos.idleFrames > 0) {
          pos.idleFrames--;
        } else {
          // 20% de chance de ir brincar com o pet se houver pets
          const petList = Object.values(state.pets);
          const shouldPet = Math.random() < 0.2 && petList.length > 0;
          
          if (shouldPet) {
            const chosenPet = petList[Math.floor(Math.random() * petList.length)];
            // Encontra um tile adjacente válido ao pet
            const adjacents = [
              { c: chosenPet.col - 1, r: chosenPet.row },
              { c: chosenPet.col + 1, r: chosenPet.row },
              { c: chosenPet.col, r: chosenPet.row - 1 },
              { c: chosenPet.col, r: chosenPet.row + 1 }
            ].filter(adj => {
              if (adj.c < 0 || adj.c >= cols || adj.r < 0 || adj.r >= rows) return false;
              const tileIdx = adj.r * cols + adj.c;
              const tileType = tiles[tileIdx];
              return (tileType === 0 || tileType === 7 || tileType === 1 || tileType === 9) && !solidFurnitureTiles.has(`${adj.c},${adj.r}`);
            });
            
            if (adjacents.length > 0) {
              const bestAdj = adjacents[Math.floor(Math.random() * adjacents.length)];
              pos.targetCol = bestAdj.c;
              pos.targetRow = bestAdj.r;
            } else {
              pos.targetCol = chosenPet.col;
              pos.targetRow = chosenPet.row;
            }

            pos.targetDir = 0;
            pos.targetMirror = false;
            pos.isRestingAtSofa = false;
            pos.idleFrames = 180 + Math.random() * 180; // Fica perto do pet por 3 a 6 segs
            
            // Fala carinhosa
            state.sendAgentSpeech(agent.id, `Fazendo carinho em ${chosenPet.name.split(' ')[0]}... ❤️`, 'done');
          } else {
            const isGoingToSofa = Math.random() < 0.4;
            if (isGoingToSofa && restSeats.length > 0) {
              const seat = restSeats[Math.floor(Math.random() * restSeats.length)];
              pos.targetCol = seat.col;
              pos.targetRow = seat.row;
              pos.targetDir = seat.dir;
              pos.targetMirror = seat.mirror;
              pos.isRestingAtSofa = true;
              pos.idleFrames = 300 + Math.random() * 300;
            } else {
              const walkable: {c: number, r: number}[] = [];
              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  const t = tiles[r * cols + c];
                  if (t === 0 || t === 7 || t === 1 || t === 9) {
                    if (!solidFurnitureTiles.has(`${c},${r}`)) {
                      walkable.push({c, r});
                    }
                  }
                }
              }
              if (walkable.length > 0) {
                const dest = walkable[Math.floor(Math.random() * walkable.length)];
                pos.targetCol = dest.c;
                pos.targetRow = dest.r;
                pos.targetDir = 0;
                pos.targetMirror = false;
                pos.isRestingAtSofa = false;
                pos.idleFrames = 100 + Math.random() * 200;
              }
            }
          }
        }
      }

      const tx = offsetX + (pos.targetCol ?? 14) * s;
      const ty = offsetY + (pos.targetRow ?? 13) * s - 16 * zoom;

      // Movimentação Lerp
      const speed = 0.8 * zoom;
      const dx = tx - pos.x;
      const dy = ty - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let isWalking = false;

      if (dist > speed) {
        isWalking = true;
        pos.x += (dx / dist) * speed;
        pos.y += (dy / dist) * speed;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          pos.dir = 2;
          pos.mirror = dx < 0;
        } else {
          pos.dir = dy > 0 ? 0 : 1;
          pos.mirror = false;
        }
      } else {
        pos.x = tx;
        pos.y = ty;
        if (pos.targetDir !== undefined) pos.dir = pos.targetDir;
        if (pos.targetMirror !== undefined) pos.mirror = pos.targetMirror;
      }

      // Salto no Party Mode
      let bounceY = 0;
      if (state.isPartyMode) {
        bounceY = Math.abs(Math.sin(this.frameCounter * 0.15 + i)) * 6 * zoom;
        // Spawna balões festivos
        if (Math.random() < 0.005) {
          const partyPhrases = ["Festa de Commit! 🎉", "Bora pro deploy! 🚀", "Uhul! 🥳", "Código rodando! 💃", "Sem bugs! 🕺"];
          state.sendAgentSpeech(agent.id, partyPhrases[Math.floor(Math.random() * partyPhrases.length)], 'done');
        }
      }

      let actionCol = 0;
      if (isWalking) {
        const walkCycle = [0, 1, 2, 1];
        const cycleIdx = Math.floor(this.frameCounter / 15) % walkCycle.length;
        actionCol = walkCycle[cycleIdx];
      } else if (isWorking) {
        actionCol = agent.status === 'reading' ? 5 : 3;
        if (Math.floor(this.frameCounter / 15) % 2 === 0) actionCol += 1;
      } else {
        actionCol = 0;
      }

      drawables.push({
        zY: pos.y + 32 * zoom,
        draw: () => {
          this.drawCharacterSprite(ctx, `char_${agent.characterIndex % 6}`, actionCol, pos.dir, pos.x, pos.y - bounceY, zoom, pos.mirror);

          // Acessórios baseados no nível
          const levelInfo = getAgentLevelInfo(agent.toolCallCount || 0);
          const ayOffset = -bounceY;
          
          if (levelInfo.accessory === 'glasses') {
            if (pos.dir === 0) {
              ctx.save();
              ctx.fillStyle = '#09090b';
              ctx.fillRect(pos.x + 4 * zoom, pos.y + 11 * zoom + ayOffset, 3 * zoom, 2 * zoom);
              ctx.fillRect(pos.x + 9 * zoom, pos.y + 11 * zoom + ayOffset, 3 * zoom, 2 * zoom);
              ctx.fillRect(pos.x + 7 * zoom, pos.y + 11 * zoom + ayOffset, 2 * zoom, 1 * zoom);
              ctx.restore();
            } else if (pos.dir === 2) {
              ctx.save();
              ctx.fillStyle = '#09090b';
              if (!pos.mirror) {
                ctx.fillRect(pos.x + 9 * zoom, pos.y + 11 * zoom + ayOffset, 4 * zoom, 2 * zoom);
                ctx.fillRect(pos.x + 5 * zoom, pos.y + 11 * zoom + ayOffset, 4 * zoom, 1 * zoom);
              } else {
                ctx.fillRect(pos.x + 3 * zoom, pos.y + 11 * zoom + ayOffset, 4 * zoom, 2 * zoom);
                ctx.fillRect(pos.x + 7 * zoom, pos.y + 11 * zoom + ayOffset, 4 * zoom, 1 * zoom);
              }
              ctx.restore();
            }
          } else if (levelInfo.accessory === 'headphones') {
            ctx.save();
            ctx.fillStyle = '#2563eb';
            if (pos.dir === 0 || pos.dir === 1) {
              ctx.fillRect(pos.x + 1 * zoom, pos.y + 8 * zoom + ayOffset, 2 * zoom, 4 * zoom);
              ctx.fillRect(pos.x + 13 * zoom, pos.y + 8 * zoom + ayOffset, 2 * zoom, 4 * zoom);
              ctx.fillRect(pos.x + 2 * zoom, pos.y + 5 * zoom + ayOffset, 12 * zoom, 1.5 * zoom);
            } else if (pos.dir === 2) {
              ctx.fillRect(pos.x + 6.5 * zoom, pos.y + 8 * zoom + ayOffset, 3 * zoom, 4 * zoom);
              ctx.fillRect(pos.x + 7.5 * zoom, pos.y + 5 * zoom + ayOffset, 1 * zoom, 3 * zoom);
            }
            ctx.restore();
          } else if (levelInfo.accessory === 'crown') {
            ctx.save();
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.fillRect(pos.x + 4 * zoom, pos.y + 2 * zoom + ayOffset, 8 * zoom, 1.5 * zoom);
            ctx.fillRect(pos.x + 4 * zoom, pos.y + ayOffset, 1.5 * zoom, 2 * zoom);
            ctx.fillRect(pos.x + 7 * zoom, pos.y + ayOffset, 2 * zoom, 2 * zoom);
            ctx.fillRect(pos.x + 10.5 * zoom, pos.y + ayOffset, 1.5 * zoom, 2 * zoom);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pos.x + 7.5 * zoom, pos.y + 1 * zoom + ayOffset, 1 * zoom, 1 * zoom);
            ctx.restore();
          }
          
          if (!isWalking && !isWorking && pos.isRestingAtSofa) {
            ctx.fillStyle = '#f5f5f4';
            const mugX = pos.x + 10 * zoom;
            const mugY = pos.y + 16 * zoom;
            ctx.fillRect(mugX, mugY, 3 * zoom, 4 * zoom);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(mugX + 0.5 * zoom, mugY, 2 * zoom, 1 * zoom);
          }
          
          if (isWorking && pos.dir === 1 && !isWalking) {
            const pcScreenX = pos.x + 2 * zoom;
            const pcScreenY = pos.y - 12 * zoom;
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(pcScreenX, pcScreenY, 12 * zoom, 8 * zoom);
            
            ctx.fillStyle = '#22c55e';
            ctx.font = `${4 * zoom}px monospace`;
            const numDrops = 3;
            for(let d = 0; d < numDrops; d++) {
              const dropY = ((this.frameCounter * (1 + d * 0.5)) % 10) * zoom;
              const dropX = d * 4 * zoom;
              if (dropY < 8 * zoom) {
                 const char = String.fromCharCode(0x30A0 + Math.random() * 96);
                 ctx.fillText(char, pcScreenX + dropX, pcScreenY + dropY);
              }
            }
            ctx.restore();
          }

          // Balão de fala
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
            const bubbleY = pos.y - bubbleH - 4 * zoom + ayOffset;

            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.roundRect(bubbleX + 2, bubbleY + 2, bubbleW, bubbleH, 4 * zoom);
            ctx.fill();

            let bgColor = 'white';
            let textColor = '#18181b';
            let strokeColor = '#e4e4e7';

            if (bubbleType === 'thinking') {
              bgColor = '#1e1b4b';
              textColor = '#e0e7ff';
              strokeColor = '#312e81';
            } else if (bubbleType === 'warning') {
              bgColor = '#7f1d1d';
              textColor = '#fee2e2';
              strokeColor = '#991b1b';
            } else if (bubbleType === 'done') {
              bgColor = '#064e3b';
              textColor = '#d1fae5';
              strokeColor = '#065f46';
            }

            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 4 * zoom);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(bubbleX + bubbleW / 2 - 2 * zoom, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + bubbleW / 2 + 2 * zoom, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + bubbleW / 2, bubbleY + bubbleH + 3 * zoom);
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1 * zoom;
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bubbleText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
            ctx.restore();
          }

          // Nome do agente
          ctx.save();
          ctx.font = `bold ${5 * zoom}px sans-serif`;
          ctx.fillStyle = '#f4f4f5';
          ctx.strokeStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 3 * zoom;
          ctx.lineWidth = 2;
          ctx.strokeText(agent.name, pos.x + 8 * zoom, pos.y + 34 * zoom + ayOffset);
          ctx.fillText(agent.name, pos.x + 8 * zoom, pos.y + 34 * zoom + ayOffset);
          ctx.restore();
        }
      });
    });

    // Atualização física e desenho dos Pets
    const walkableForPets: {c: number, r: number}[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = tiles[r * cols + c];
        if (t === 0 || t === 7 || t === 1 || t === 9) {
          if (!solidFurnitureTiles.has(`${c},${r}`)) {
            walkableForPets.push({ c, r });
          }
        }
      }
    }

    const updatedPets = { ...state.pets };
    let petsUpdated = false;

    Object.values(updatedPets).forEach((pet) => {
      if (pet.x === 0 && pet.y === 0) {
        pet.x = offsetX + pet.col * s;
        pet.y = offsetY + pet.row * s - 4 * zoom;
        petsUpdated = true;
      }

      const tx = offsetX + pet.targetCol * s;
      const ty = offsetY + pet.targetRow * s - 4 * zoom;

      const speed = 0.5 * zoom; // pets andam um pouco mais devagar
      const dx = tx - pet.x;
      const dy = ty - pet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > speed) {
        pet.x += (dx / dist) * speed;
        pet.y += (dy / dist) * speed;
        pet.mirror = dx < 0;
        petsUpdated = true;
      } else {
        pet.x = tx;
        pet.y = ty;
        pet.col = pet.targetCol;
        pet.row = pet.targetRow;

        // 1% de chance a cada frame de mudar o rumo
        if (Math.random() < 0.01 && walkableForPets.length > 0) {
          const next = walkableForPets[Math.floor(Math.random() * walkableForPets.length)];
          pet.targetCol = next.c;
          pet.targetRow = next.r;
          petsUpdated = true;
        }
      }

      // Adiciona o Pet aos drawables para Z-sorting
      drawables.push({
        zY: pet.y + 16 * zoom,
        draw: () => this.drawPet(ctx, pet, zoom)
      });
    });

    if (petsUpdated) {
      useOfficeStore.setState({ pets: updatedPets });
    }

    // Z-Sort e Desenho Final
    drawables.sort((a, b) => a.zY - b.zY);
    for (const d of drawables) {
      d.draw();
    }

    // Iluminação e Party Mode
    if (state.isPartyMode) {
      // Luzes piscantes neon da festa
      const partyColors = [
        'rgba(236, 72, 153, 0.2)', // Rosa
        'rgba(59, 130, 246, 0.2)', // Azul
        'rgba(168, 85, 247, 0.2)', // Roxo
        'rgba(34, 197, 94, 0.2)'   // Verde
      ];
      ctx.fillStyle = partyColors[Math.floor(this.frameCounter / 20) % partyColors.length];
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Partículas de Confetes
      ctx.save();
      for (let p = 0; p < 20; p++) {
        const cx = (Math.sin(this.frameCounter * 0.02 + p * 5) * 0.5 + 0.5) * canvasWidth;
        const cy = ((this.frameCounter * (1 + (p % 3) * 0.3) + p * 40) % canvasHeight);
        const confeteColors = ['#f43f5e', '#3b82f6', '#eab308', '#a855f7', '#10b981'];
        ctx.fillStyle = confeteColors[p % confeteColors.length];
        ctx.fillRect(cx, cy, 3 * zoom, 3 * zoom);
      }
      ctx.restore();
    } else if (theme === 'default-layout-1' || theme === 'light') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      const isHacker = theme === 'hacker-basement';
      ctx.fillStyle = isHacker ? 'rgba(5, 20, 10, 0.45)' : 'rgba(9, 9, 11, 0.55)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Luzes perto de PCs ligados
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
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            } else {
              gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
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

  public getAgentAtCoordinates(
    canvasWidth: number,
    canvasHeight: number,
    zoom: number,
    mouseX: number,
    mouseY: number,
    panX: number,
    panY: number
  ): string | null {
    if (!this.mapData) return null;
    for (const [agentId, pos] of this.agentPos.entries()) {
      const ax = pos.x;
      const ay = pos.y;
      const aw = 16 * zoom;
      const ah = 32 * zoom;

      if (mouseX >= ax && mouseX <= ax + aw && mouseY >= ay && mouseY <= ay + ah) {
        return agentId;
      }
    }
    return null;
  }
  
  public getFurnitureAtCoordinates(
    canvasWidth: number,
    canvasHeight: number,
    zoom: number,
    mouseX: number,
    mouseY: number,
    panX: number,
    panY: number
  ): string | null {
    if (!this.mapData || !this.mapData.furniture) return null;
    
    const TILE_SIZE = 16;
    const cols = this.mapData.cols;
    const rows = this.mapData.rows;
    const s = TILE_SIZE * zoom;
    const mapW = cols * s;
    const mapH = rows * s;
    const offsetX = Math.floor((canvasWidth - mapW) / 2 + panX);
    const offsetY = Math.floor((canvasHeight - mapH) / 2 + panY);

    for (const f of this.mapData.furniture) {
      const fx = offsetX + f.col * s;
      const fy = offsetY + f.row * s;
      const fw = s;
      const fh = s;

      if (mouseX >= fx && mouseX <= fx + fw && mouseY >= fy && mouseY <= fy + fh) {
        return f.uid;
      }
    }
    return null;
  }
}
