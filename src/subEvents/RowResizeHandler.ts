import type { ISubEvents } from "./ISubEvents.js";
import type { RowResize } from "../functionality/RowResize.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import { RowHoverCheck, RowResizeCheck } from "../utils/Constants.js";

export class RowResizeHandler implements ISubEvents 
{
    constructor(private rowResize: RowResize) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        return Boolean(handler[RowHoverCheck]);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        this.rowResize.SetRowResizeState(e, handler);
    }

    public onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void 
    {
        this.rowResize.StoreRowResizeValue(e, handler);
    }

    public onPointerUp(e: PointerEvent, handler: InteractionHandler): void 
    {
        this.rowResize.SaveRowResizeValue(handler);
        handler[RowResizeCheck] = null;
    }
}