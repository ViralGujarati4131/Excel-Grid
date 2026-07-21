import type { ISubEvents } from "./ISubEvents.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";

export class RowSelectionHandlers implements ISubEvents 
{
    constructor(
        private cellRangeSelection: CellRangeSelection,
        private viewport: Viewport
    ) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        // is mouse is down for entire row select
        return x < this.viewport.headerWidth && Boolean(indices);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        if (indices) 
            this.cellRangeSelection.RowSelect(indices, handler);
    }

    public onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void 
    {
        this.cellRangeSelection.rangeSelectionUsingPointer(e, handler, x, y, width, height);
    }

    public onPointerUp(e: PointerEvent, handler: InteractionHandler): void {}
}