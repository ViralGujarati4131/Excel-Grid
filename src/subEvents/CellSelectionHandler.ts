import type { ISubEvents } from "./ISubEvents.js";
import type { CellSelection } from "../functionality/CellSelection.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import { IsSelectRange } from "../utils/Constants.js";

export class CellSelectionHandler implements ISubEvents 
{
    constructor(
        private cellSelection: CellSelection,
        private cellRangeSelection: CellRangeSelection
    ) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        return Boolean(indices && indices.rowIdx !== -1 && indices.colIdx !== -1);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        if (indices) {
            handler[IsSelectRange] = true;
            this.cellSelection.CellSelect(indices, handler);
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