import type { Workbook } from "../core/Workbook.js";
import type { Viewport } from "./Viewport.js";
import type { SelectionState } from "../events/InteractionHandler.js";

export interface IRenderer {
    render(workbook: Workbook, viewport: Viewport, selection: SelectionState | null): void;
    resize(width: number, height: number): void;
    getCanvasElement(): HTMLCanvasElement;
}