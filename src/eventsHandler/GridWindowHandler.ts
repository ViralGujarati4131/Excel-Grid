import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CanvasScroll } from "../functionality/CanvasScroll.js";
import type { InteractionHandler } from "./InteractionHandler.js";

export class GridWindowHandler {
    constructor(
        private canvasScroll: CanvasScroll,
        private renderer: CanvasRenderer,
        private updateView: () => void
    ) {}

    public handleResize(): void 
    {
        this.renderer.resize(window.innerWidth, window.innerHeight - 40);
        this.updateView();
    }

    public handleScroll(e: WheelEvent,handler: InteractionHandler): void 
    {
        this.canvasScroll.handleCanvasScroll(e,handler);
    }
}