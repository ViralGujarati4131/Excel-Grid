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

export class GridMouseHandler 
{
    private lastMoveTime = 0;
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor,
        private cellEditing: CellEditing,
        private cellRangeSelection: CellRangeSelection,
        private rowResize: RowResize,
        private columnResize: ColumnResize
    ) {}

    public handlePointerDown(e: PointerEvent, handler: InteractionHandler): void 
    {
        const canvas = this.renderer.getCanvasElement();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        canvas.setPointerCapture(e.pointerId);
        
        // check if mouse down is for resizing 
        if(handler["rowHoverResizeInfo"])
        {
            this.rowResize.SetRowResizeState(e,handler);
            return;
        }
        if(handler["columnHoverResizeInfo"])
        {   
            this.columnResize.SetColumnResizeState(e,handler);
            return;
        }

        // if mouse is at left top side than clear selection
        if (x < this.viewport.headerWidth && y < this.viewport.headerHeight) 
        {
            this.cellRangeSelection.clearSelection(handler);
            return;
        }

        // get index or row column for check where mouse is down
        const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
        if (!indices) return;
        
        this.editor.getElement().blur();
        handler["isSelectingRange"] = true;

        // is mouse is down for entire cloumn select
        if (y < this.viewport.headerHeight) 
        {
            this.cellRangeSelection.columnSelection(indices, handler);
            return;
        }

        // is mouse is down for entire row select
        if (x < this.viewport.headerWidth) 
        {
            this.cellRangeSelection.rowSelection(indices, handler);
            return;
        }

        // is mouse is down for the cell select
        if (indices.rowIdx !== -1 && indices.colIdx !== -1) 
        {
            this.cellRangeSelection.cellSelection(indices, handler);
        }
    }

    public handlePointerMove(e: PointerEvent, handler: InteractionHandler): void 
    {
        const canvas = this.renderer.getCanvasElement();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // move mouse for resize the size of column or row
        if(handler["rowResizeState"])
        {
            const now = performance.now();
            const delayMs = 50;
            if (now - this.lastMoveTime < delayMs) {
                return;
            }
            this.lastMoveTime = now;

            this.rowResize.StoreRowResizeValue(e,handler);
            return;
        }
        if(handler["columnResizeState"])
        {   
            const now = performance.now();
            const delayMs = 50;
            if (now - this.lastMoveTime < delayMs) {
                return;
            }
            this.lastMoveTime = now;

            this.columnResize.StoreColumnResizeValue(e,handler);
            return;
        }

        // move mouse for cell range selection
        if (handler["isSelectingRange"] && handler.selection) 
        {
            const now = performance.now();
            const delayMs = 100;
            if (now - this.lastMoveTime < delayMs) {
                return;
            }
            this.lastMoveTime = now;

            this.cellRangeSelection.rangeSelectionUsingPointer(e, handler, x, y, canvas.width, canvas.height);
            return;
        }

        // change cursor type if near to row or column header edge for resize other wise default
        handler["columnHoverResizeInfo"] = CheckColumnHoverEdge(x, y, this.viewport, this.renderer, this.workbook, canvas);
        
        if(handler["columnHoverResizeInfo"] === null)
            handler["rowHoverResizeInfo"] = CheckRowHoverEdge(x, y, this.viewport, this.renderer, this.workbook, canvas);
    }

    public handlePointerUp(e: PointerEvent, handler: InteractionHandler): void 
    {  
        const canvas = this.renderer.getCanvasElement();
        try {
            canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}

        // if row or column resized happen than store that value command and put it to history undo array 
        // clear the resize states because resize complete and mouse up
        if(handler["rowResizeState"])
        {
            this.rowResize.SaveRowResizeValue(handler);
            handler["rowResizeState"] = null;
        }
        if(handler["columnResizeState"])
        {
            this.columnResize.SaveColumnResizeValue(handler);
            handler["columnResizeState"] = null;
        }
        
        handler["isSelectingRange"] = false;
    }

    public handleDoubleClick(e: MouseEvent, handler: InteractionHandler): void 
    {
        this.cellEditing.ActiveCell(handler, e);
    }
}