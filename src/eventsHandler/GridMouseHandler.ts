import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CellEditor } from "../components/CellEditor.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";
import { InteractionHandler } from "./InteractionHandler.js";
import { CellEditing } from "../functionality/CellEditing.js";
import { RowColumnResizeManager } from "../functionality/RowCoulmnResizeManager.js";
import type { CellRangeSelection } from "../functionality/CellRangeSelection.js";

export class GridMouseHandler 
{
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor,
        private rowColumnResizeManager: RowColumnResizeManager,
        private cellEditing: CellEditing,
        private cellRangeSelection: CellRangeSelection
    ) {}

    // mouse down mean when we just press the mouse
    public handleMouseDown(e: MouseEvent, handler: InteractionHandler): void 
    {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // check if mouse down is for resizing 
        if (handler["hoverResizeInfo"]) 
        {
            this.rowColumnResizeManager.setResizeState(e,handler);   
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
        if (!indices) 
            return;

        this.editor.getElement().blur();
        handler["isSelectingRange"] = true;

        // is mouse is down for entire cloumn select
        if (y < this.viewport.headerHeight) 
        {
            this.cellRangeSelection.columnSelection(indices,handler);
            return;
        }

        // is mouse is down for entire row select
        if (x < this.viewport.headerWidth) 
        {
            this.cellRangeSelection.rowSelection(indices,handler);
            return;
        }

        // is mouse is down for the cell select
        if (indices.rowIdx !== -1 && indices.colIdx !== -1) 
        {
            this.cellRangeSelection.cellSelection(indices,handler);
        }
    }

    // this is for show resize icon for row, column and
    public handleMouseMove(e: MouseEvent, handler: InteractionHandler): void 
    {
        const canvas = this.renderer.getCanvasElement();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // move mouse for resize the size of column or row
        if(handler["resizeState"])
        {
            this.rowColumnResizeManager.storeResizeValue(e,handler);
            return;
        }

         // move mouse for cell range selection
        if (handler["isSelectingRange"] && handler.selection) 
        {
            this.cellRangeSelection.rangeSelectionUsingMouse(e,handler,x,y,canvas.width,canvas.height);
            return;
        }

        // change cursor type if near to row or column header edge for resize other wise default
        handler["hoverResizeInfo"] = this.rowColumnResizeManager.checkHoverEdge(x, y);
    }

    public handleMouseUp(handler: InteractionHandler): void 
    {  
        // if row column resized happen than store that value command and put it to history undo array 
        this.rowColumnResizeManager.SaveResizeValue(handler);
        // clear the resize state resize complete and mouse up
        handler["resizeState"] = null;

        // clear the isSelectingRange variable after complete selection and mouse up
        handler["isSelectingRange"] = false;
    }

    // this is to handle double click event
    public handleDoubleClick(e: MouseEvent, handler: InteractionHandler): void 
    {
        this.cellEditing.ActiveCell(handler,e);
    }
}