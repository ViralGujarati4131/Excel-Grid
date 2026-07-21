import type { ISubEvents } from "./ISubEvents.js";
import type { ColumnSelection } from "../functionality/ColumnSelection.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import { IsSelectRange } from "../utils/Constants.js";

export class ColumnSelectionHandler implements ISubEvents 
{
    constructor(
        private columnSelection: ColumnSelection,
        private cellRangeSelection: CellRangeSelection,
        private viewport: Viewport
    ) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        return y < this.viewport.headerHeight && Boolean(indices);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        if (indices) {
            handler[IsSelectRange] = true;
            this.columnSelection.ColumnSelect(indices, handler);
        }
    }

    public onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void 
    {
        this.cellRangeSelection.rangeSelectionUsingPointer(e, handler, x, y, width, height);
    }

    public onPointerUp(e: PointerEvent, handler: InteractionHandler): void 
    {
        handler[IsSelectRange] = false;
    }
}