import type { ISubEvents } from "./ISubEvents.js";
import type { RowSelection } from "../functionality/RowSelection.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import { IsSelectRange } from "../utils/Constants.js";

export class RowSelectionHandlers implements ISubEvents 
{
    constructor(
        private rowSelection: RowSelection,
        private cellRangeSelection: CellRangeSelection,
        private viewport: Viewport
    ) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        return x < this.viewport.headerWidth && Boolean(indices);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        if (indices) {
            handler[IsSelectRange] = true;
            this.rowSelection.RowSelect(indices, handler);
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