import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CellEditor } from "../components/CellEditor.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";
import { InteractionHandler } from "./InteractionHandler.js";
import { CellEditing } from "../functionality/CellEditing.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import { CheckRowHoverEdge } from "../utils/CheckRowHoverEdge.js";
import { CheckColumnHoverEdge } from "../utils/CheckColumnHoverEdge.js";
import type { RowResize } from "../functionality/RowResize.js";
import type { ColumnResize } from "../functionality/ColumnResize.js";
import { ColumnHoverInfoCheck, Delays, RowHoverInfoCheck } from "../utils/Constants.js";
import type { ISubEvents } from "../subEvents/ISubEvents.js";
import { RowResizeHandler } from "../subEvents/RowResizeHandler.js";
import { ColumnResizeHandler } from "../subEvents/ColumnResizeHandler.js";
import { ColumnSelectionHandler } from "../subEvents/ColumnSelectionHandler.js";
import { RowSelectionHandlers } from "../subEvents/RowSelectionHandler.js";
import { CellSelectionHandler } from "../subEvents/CellSelectionHandler.js";

export class GridMouseHandler 
{
    private lastMoveTime = 0;
    private hitChecks: ISubEvents[];
    private activeHandler: ISubEvents | null = null;

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor,
        private cellEditing: CellEditing,
        private cellRangeSelection: CellRangeSelection,
        private rowResize: RowResize,
        private columnResize: ColumnResize
    ) {
        this.hitChecks = [
            new RowResizeHandler(this.rowResize),
            new ColumnResizeHandler(this.columnResize),
            new ColumnSelectionHandler(this.cellRangeSelection, this.viewport),
            new RowSelectionHandlers(this.cellRangeSelection, this.viewport),
            new CellSelectionHandler(this.cellRangeSelection)
        ];
    }

    public handlePointerDown(e: PointerEvent, handler: InteractionHandler): void 
    {
        const canvas = this.renderer.getCanvasElement();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        canvas.setPointerCapture(e.pointerId);

        // if mouse is at left top side than clear selection
        if (x < this.viewport.headerWidth && y < this.viewport.headerHeight) 
        {
            this.cellRangeSelection.clearSelection(handler);
            return;
        }

        // get index or row column for check where mouse is down
        const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
        this.editor.getElement().blur();
        
        // check hitcase on pointer down
        for (const hit of this.hitChecks) 
        {
            if (hit.hitCheck(e, x, y, indices, handler)) 
            {
                this.activeHandler = hit;
                this.activeHandler.onPointerDown(e, x, y, indices, handler);
                break;
            }
        }
    }

    public handlePointerMove(e: PointerEvent, handler: InteractionHandler): void 
    {
        const canvas = this.renderer.getCanvasElement();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.activeHandler) 
        {
            const now = performance.now();
            if (now - this.lastMoveTime < Delays.FiftyMS) 
            {
                return;
            }
            this.lastMoveTime = now;

            this.activeHandler.onPointerMove(e, x, y, handler, canvas.width, canvas.height);
            return;
        }

        // change cursor type if near to row or column header edge for resize other wise default
        handler[ColumnHoverInfoCheck] = CheckColumnHoverEdge(x, y, this.viewport, this.renderer, this.workbook, canvas);
        
        if(handler[ColumnHoverInfoCheck] === null)
            handler[RowHoverInfoCheck] = CheckRowHoverEdge(x, y, this.viewport, this.renderer, this.workbook, canvas);
    }

    public handlePointerUp(e: PointerEvent, handler: InteractionHandler): void 
    {  
        const canvas = this.renderer.getCanvasElement();
        try 
        {
            canvas.releasePointerCapture(e.pointerId);
        } 
        catch (err) {}

        if (this.activeHandler) 
        {
            this.activeHandler.onPointerUp(e, handler);
            this.activeHandler = null; 
        }
    }

    public handleDoubleClick(e: MouseEvent, handler: InteractionHandler): void 
    {
        this.cellEditing.ActiveCell(handler, e);
    }
}