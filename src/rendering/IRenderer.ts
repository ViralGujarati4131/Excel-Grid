import type { Workbook } from "../core/Workbook.js";
import type { Viewport } from "./Viewport.js";
import type { SelectionState } from "../eventsHandler/InteractionHandler.js";
import type { CellSelectionState, ColumnSelectionState, RowSelectionState } from "../utils/States.js";

export interface IRenderer 
{
    // render the viewport, workbook and selection
    render(workbook: Workbook, viewport: Viewport, selection: SelectionState | null,cellState: CellSelectionState | null,rowState: RowSelectionState | null,columnState: ColumnSelectionState | null): void;

    // resize canvas according to resize the window
    resize(width: number, height: number): void;

    // get canvas element
    getCanvasElement(): HTMLCanvasElement;
}