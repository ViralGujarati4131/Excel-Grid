import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CanvasScroll } from "../functionality/CanvasScroll.js";
import type { InteractionHandler } from "./InteractionHandler.js";

export class GridWindowHandler {
    
    private lastMoveTime = 0;
    constructor(
        private canvasScroll: CanvasScroll,
        private renderer: CanvasRenderer
    ) {}

    public handleResize(handler: InteractionHandler): void 
    {
        this.renderer.resize(window.innerWidth, window.innerHeight - 40);
        handler.updateView();
    }

    public handleScroll(e: WheelEvent,handler: InteractionHandler): void 
    {
        const now = performance.now();
        const delayMs = 25;
        if (now - this.lastMoveTime < delayMs) {
            return;
        }
        this.lastMoveTime = now;

        this.canvasScroll.handleCanvasScroll(e,handler);
    }
}