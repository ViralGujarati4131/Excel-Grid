import type { ISubEvents } from "./ISubEvents.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";

export class CellSelectionHandler implements ISubEvents 
{
    constructor(
        private cellRangeSelection: CellRangeSelection
    ) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        // is mouse is down for the cell select
        return Boolean(indices && indices.rowIdx !== -1 && indices.colIdx !== -1);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        if (indices)
            this.cellRangeSelection.CellSelect(indices, handler);
    }

    public onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void 
    {
        this.cellRangeSelection.rangeSelectionUsingPointer(e, handler, x, y, width, height);
    }

    public onPointerUp(e: PointerEvent, handler: InteractionHandler): void {}
}