import type { ISubEvents } from "./ISubEvents.js";
import type { ColumnResize } from "../functionality/ColumnResize.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import { ColumnHoverCheck, ColumnResizeCheck } from "../utils/Constants.js";

export class ColumnResizeHandler implements ISubEvents 
{
    constructor(private columnResize: ColumnResize) {}

    public hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean 
    {
        // check if mouse down is for column resizing 
        return Boolean(handler[ColumnHoverCheck]);
    }

    public onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void 
    {
        this.columnResize.SetColumnResizeState(e, handler);
    }

    public onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void 
    {
        this.columnResize.StoreColumnResizeValue(e, handler);
    }

    public onPointerUp(e: PointerEvent, handler: InteractionHandler): void 
    {
        this.columnResize.SaveColumnResizeValue(handler);
        handler[ColumnResizeCheck] = null;
    }
}