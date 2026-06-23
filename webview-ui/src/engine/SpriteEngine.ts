export const FRAMES = {
  idle: [
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEKKKKKKEEEEE",
    "EEEEKhhhhHHKEEEE",
    "EEEKHHHHHHHHKEEE",
    "EEEDHHHHHHHHKEEE",
    "EEEKSSKSSKSSKEEE",
    "EEEKWWKSSKWWKEEE",
    "EEEKeKKSSeKKeEEE",
    "EEEKSSSSSSSSKEEE",
    "EEEEKSSSSSSKEEEE",
    "EEEEEKKssssKEEEE",
    "EEEEKCCKCCKCEEEE",
    "EEEKcccCCCCcKEEE",
    "EEEKCSKCCCCKSEEE",
    "EEEKSSKCCCCKSEEE",
    "EEEEKKCCCCKKEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEKKKKKKKKEEEE",
    "EEEEKKKEEKKKEEEE",
    "EEEEEEEEEEEEEEEE"
  ],
  walk1: [
    "EEEEEEEEEEEEEEEE",
    "EEEEEKKKKKKEEEEE",
    "EEEEKhhhhHHKEEEE",
    "EEEKHHHHHHHHKEEE",
    "EEEDHHHHHHHHKEEE",
    "EEEKSSKSSKSSKEEE",
    "EEEKWWKSSKWWKEEE",
    "EEEKeKKSSeKKeEEE",
    "EEEKSSSSSSSSKEEE",
    "EEEEKSSSSSSKEEEE",
    "EEEEEKKssssKEEEE",
    "EEEEKCCKCCKCEEEE",
    "EEEKcccCCCCcKEEE",
    "EEEKCSKCCCCKSEEE",
    "EEEEKSKCCCCKEEEE", 
    "EEEEEKCCCCCKEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE", 
    "EEEEKKPPKPKEEEEE",
    "EEEEKKKPKPKEEEEE",
    "EEEEEKKPKPKEEEEE",
    "EEEEEEEKKKKEEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE"
  ],
  walk2: [
    "EEEEEEEEEEEEEEEE",
    "EEEEEKKKKKKEEEEE",
    "EEEEKhhhhHHKEEEE",
    "EEEKHHHHHHHHKEEE",
    "EEEDHHHHHHHHKEEE",
    "EEEKSSKSSKSSKEEE",
    "EEEKWWKSSKWWKEEE",
    "EEEKeKKSSeKKeEEE",
    "EEEKSSSSSSSSKEEE",
    "EEEEKSSSSSSKEEEE",
    "EEEEEKKssssKEEEE",
    "EEEEKCCKCCKCEEEE",
    "EEEKcccCCCCcKEEE",
    "EEEKCSKCCCCKSEEE",
    "EEEEKCCCCKSKEEEE", 
    "EEEEEKCCCCCKEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE", 
    "EEEEEKPKPPKKEEEE",
    "EEEEEKPKPKKKEEEE",
    "EEEEEKPKPKKEEEEE",
    "EEEEEKKKKEEEEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE"
  ],
  type1: [
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEKKKKKKEEEEE",
    "EEEEKhhhhHHKEEEE",
    "EEEKHHHHHHHHKEEE",
    "EEEDHHHHHHHHKEEE",
    "EEEKSSKSSKSSKEEE",
    "EEEKWWKSSKWWKEEE",
    "EEEKeKKSSeKKeEEE",
    "EEEKSSSSSSSSKEEE",
    "EEEEKSSSSSSKEEEE",
    "EEEEEKKssssKEEEE",
    "EEEEKCCKCCKCEEEE",
    "EEEKcccCCCCcKEEE",
    "EEEKCSKCCCCKSEEE",
    "EEEKSKCCCCCCKEEE", 
    "EEKKKKCCCCCKKKEE", 
    "EESSSKPPPPKSSSEE", 
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEKKKKKKKKEEEE",
    "EEEEKKKEEKKKEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE"
  ],
  type2: [
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEKKKKKKEEEEE",
    "EEEEKhhhhHHKEEEE",
    "EEEKHHHHHHHHKEEE",
    "EEEDHHHHHHHHKEEE",
    "EEEKSSKSSKSSKEEE",
    "EEEKWWKSSKWWKEEE",
    "EEEKeKKSSeKKeEEE",
    "EEEKSSSSSSSSKEEE",
    "EEEEKSSSSSSKEEEE",
    "EEEEEKKssssKEEEE",
    "EEEEKCCKCCKCEEEE",
    "EEEKcccCCCCcKEEE",
    "EEEKCSKCCCCKSEEE",
    "EEEKCKCCCCCCKSEE", 
    "EEKSSKCCCCCKKKEE", 
    "EESSSKPPPPKSSSEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEEKPPPPKEEEEE",
    "EEEEKKKKKKKKEEEE",
    "EEEEKKKEEKKKEEEE",
    "EEEEEEEEEEEEEEEE",
    "EEEEEEEEEEEEEEEE"
  ]
};

export type Palette = {
  skin: string;
  skinShadow: string;
  hair: string;
  hairHighlight: string;
  hairDark: string;
  shirt: string;
  shirtShadow: string;
  pants: string;
  pantsShadow: string;
};

export class SpriteEngine {
  private cache: Record<number, Record<string, HTMLCanvasElement>> = {};
  private isPreRendered = false;

  public preRender(palettes: readonly Palette[]) {
    if (this.isPreRendered) return;
    
    for (let pIdx = 0; pIdx < palettes.length; pIdx++) {
      this.cache[pIdx] = {};
      const pal = palettes[pIdx];

      const colorMap: Record<string, string> = {
        'K': '#1a1c2c', // Outline
        'W': '#f4f4f4', // Eye white
        'e': '#1a1c2c', // Pupil
        'S': pal.skin,
        's': pal.skinShadow,
        'H': pal.hair,
        'h': pal.hairHighlight,
        'D': pal.hairDark,
        'C': pal.shirt,
        'c': pal.shirtShadow,
        'P': pal.pants,
        'p': pal.pantsShadow
      };

      for (const [frameName, matrix] of Object.entries(FRAMES)) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // Desenhar pixel por pixel
        for (let y = 0; y < 24; y++) {
          for (let x = 0; x < 16; x++) {
            const char = matrix[y][x];
            if (char !== 'E' && colorMap[char]) {
              ctx.fillStyle = colorMap[char];
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        
        this.cache[pIdx][frameName] = canvas;
      }
    }
    this.isPreRendered = true;
  }

  public getSprite(paletteIndex: number, frameName: string): HTMLCanvasElement | null {
    if (!this.cache[paletteIndex]) return null;
    return this.cache[paletteIndex][frameName] || null;
  }
}

export const spriteEngine = new SpriteEngine();
