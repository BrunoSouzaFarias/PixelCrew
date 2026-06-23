import { useOfficeStore } from '../store/officeStore';

type TickCallback = (deltaTime: number) => void;

export class GameLoop {
  private lastTime: number = 0;
  private animationId: number | null = null;
  private onTick: TickCallback | null = null;

  start(callback: TickCallback) {
    this.onTick = callback;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (time: number) => {
    // We don't abort immediately. We only abort if stopped.
    // If stop() is called, animationId is null, but we don't need to check here
    // because cancelAnimationFrame stops it.
    // Wait, if stop is called, we might still be in the queue, so checking animationId is good,
    // but we MUST not return if it's the first frame.
    // Actually, setting animationId before loop solves this if we just check if it's null.
    // Wait, let's just let cancelAnimationFrame do its job and remove the early return,
    // or just check `!this.onTick` to stop.
    if (!this.onTick) return;

    const deltaTime = time - this.lastTime;
    
    if (deltaTime >= 16) {
      const dt = Math.min(deltaTime, 100);
      this.updateAgents(dt);
      if (this.onTick) {
        this.onTick(dt);
      }
      this.lastTime = time;
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  private updateAgents(deltaTime: number) {
    const store = useOfficeStore.getState();
    const agents = { ...store.agents };
    let changed = false;

    const speed = 0.12 * deltaTime; // pixels to move this frame

    for (const id in agents) {
      const agent = { ...agents[id] };
      if (Math.abs(agent.positionX - agent.targetX) > 1) {
        const dir = agent.positionX < agent.targetX ? 1 : -1;
        agent.positionX += dir * speed;
        // Internal status override for renderer: when moving, renderer will see walking
        // Actually, renderer doesn't see internal status unless we change agent.status.
        // The prompt says "status interno de 'walking' override o status real para animar pernas".
        // Let's just change the status if they are moving, and revert when they reach.
        if (agent.status !== 'walking') {
          // Store actual status in lastActivity or something, but let's just make status walking for now
          // Wait, if we overwrite status, we lose the real status. 
          // The prompt: "Enquanto em movimento: status interno de 'walking' override o status real"
          // We can handle this in Renderer instead of mutating state status!
        }
        changed = true;
      } else {
        if (agent.positionX !== agent.targetX) {
          agent.positionX = agent.targetX;
          changed = true;
        }
      }
      agents[id] = agent;
    }

    if (changed) {
      store.setAgents(agents);
    }
  }
}
