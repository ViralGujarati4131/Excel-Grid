import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeColumnCommand } from "../undoRedo/commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "../undoRedo/commands/ResizeRowCommand.js";
import { RowColumnResizeManage } from "../utils/RowColumnResizeManage.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";
import { InteractionHandler } from "./InteractionHandler.js";
import type { SelectionState } from "./InteractionHandler.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";

export class GridMouseHandler 
{
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor,
        private history: CommandHistory,
        private resizeManager: RowColumnResizeManage,
        private updateView: () => void
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
            // column resize
            if (handler["hoverResizeInfo"].type === "column") 
            {
                const col = this.workbook.columns[handler["hoverResizeInfo"].index];
                if (col) 
                {
                    handler["resizeState"] = {
                        type: "column",
                        index: handler["hoverResizeInfo"].index,
                        startPos: e.clientX,
                        startSize: col.width
                    };
                }
            } 
            else 
            {
                // row resize
                const row = this.workbook.rows[handler["hoverResizeInfo"].index];
                if (row) 
                {
                    handler["resizeState"] = {
                        type: "row",
                        index: handler["hoverResizeInfo"].index,
                        startPos: e.clientY,
                        startSize: row.height
                    };
                }
            }
            this.editor.hide();
            return;
        }

        // if mouse is at left top side than clear selection
        if (x < this.viewport.headerWidth && y < this.viewport.headerHeight) 
        {
            handler.selection = null;
            this.editor.hide();
            this.updateView();
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
            if (indices.colIdx !== -1) 
            {
                const col = this.workbook.columns[indices.colIdx];
                if (col) 
                {
                    handler["dragSelectionType"] = "column";
                    handler.selection = {
                        type: "column",
                        rowId: null,
                        colName: col.name,
                        startColIdx: indices.colIdx,
                        endColIdx: indices.colIdx,
                        startRowIdx: 0,
                        endRowIdx: this.workbook.rows.length - 1
                    };
                }
            }
            this.updateView();
            return;
        }

        // is mouse is down for entire row select
        if (x < this.viewport.headerWidth) 
        {
            if (indices.rowIdx !== -1) 
            {
                const row = this.workbook.rows[indices.rowIdx];
                if (row) 
                {
                    handler["dragSelectionType"] = "row";
                    handler.selection = {
                        type: "row",
                        rowId: row.id,
                        colName: null,
                        startRowIdx: indices.rowIdx,
                        endRowIdx: indices.rowIdx,
                        startColIdx: 0,
                        endColIdx: this.workbook.columns.length - 1
                    };
                }
            }
            this.updateView();
            return;
        }

        // is mouse is down for the cell select
        if (indices.rowIdx !== -1 && indices.colIdx !== -1) 
        {
            const row = this.workbook.rows[indices.rowIdx];
            const col = this.workbook.columns[indices.colIdx];
            if (row && col) 
            {
                handler["dragSelectionType"] = "cell";
                handler.selection = {
                    type: "cell",
                    rowId: row.id,
                    colName: col.name,
                    startRowIdx: indices.rowIdx,
                    startColIdx: indices.colIdx,
                    endRowIdx: indices.rowIdx,
                    endColIdx: indices.colIdx
                };
            }
            this.updateView();
        }
    }

    // this is for show resize icon for row, column and
    public handleMouseMove(e: MouseEvent, handler: InteractionHandler): void 
    {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // move mouse for resize the size of column or row
        if (handler["resizeState"]) 
        {
            if (handler["resizeState"].type === "column") 
            {        
                const deltaX = e.clientX - handler["resizeState"].startPos;
                const col = this.workbook.columns[handler["resizeState"].index];

                if (col) 
                    col.width = Math.max(30, handler["resizeState"].startSize + deltaX);
            } 
            else 
            {
                const deltaY = e.clientY - handler["resizeState"].startPos;
                const row = this.workbook.rows[handler["resizeState"].index];

                if (row) 
                    row.height = Math.max(15, handler["resizeState"].startSize + deltaY);
            }
            this.updateView();
            return;
        }

         // move mouse for multi cell selection
        if (handler["isSelectingRange"] && handler.selection) 
        {
            const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
            if (indices) 
            {
                if (handler["dragSelectionType"] === "column" && indices.colIdx !== -1) 
                {
                    // when you select mutliple columns or single column while moving
                    handler.selection.endColIdx = indices.colIdx;
                    handler.selection.type = (handler.selection.startColIdx === handler.selection.endColIdx) ? "column" : "columnRange";                    
                } 
                else if (handler["dragSelectionType"] === "row" && indices.rowIdx !== -1) 
                {
                    // when you select multiple rows or single row while moving
                    handler.selection.endRowIdx = indices.rowIdx;
                    handler.selection.type = (handler.selection.startRowIdx === handler.selection.endRowIdx) ? "row" : "rowRange";
                } 
                else if (handler["dragSelectionType"] === "cell" && indices.rowIdx !== -1 && indices.colIdx !== -1) 
                {
                    // when you select multiple cells or single cell while moving
                    handler.selection.endRowIdx = indices.rowIdx;
                    handler.selection.endColIdx = indices.colIdx;
                    handler.selection.type = (handler.selection.startRowIdx === handler.selection.endRowIdx && handler.selection.startColIdx === handler.selection.endColIdx) ? "cell" : "range";
                }
                adjustViewportToCell(handler.selection.endRowIdx!, handler.selection.endColIdx!, this.renderer, this.workbook, this.viewport);
                this.updateView();
            }
            return;
        }

        // change cursor type if near to row or column header edge for resize other wise default
        handler["hoverResizeInfo"] = this.resizeManager.checkHoverEdge(
            x, y, this.workbook, this.viewport, this.renderer, this.renderer.getCanvasElement()
        );
    }

    public handleMouseUp(handler: InteractionHandler): void 
    {  
        // if row column resized happen than store that value command and put it to history undo array 
        if (handler["resizeState"]) 
        {
            // column resize
            if (handler["resizeState"].type === "column") 
            {
                const col = this.workbook.columns[handler["resizeState"].index];

                if (col && col.width !== handler["resizeState"].startSize) 
                    this.history.add(new ResizeColumnCommand(col, col.width, handler["resizeState"].startSize));
            } 
            else 
            {
                // row resize
                const row = this.workbook.rows[handler["resizeState"].index];

                if (row && row.height !== handler["resizeState"].startSize) 
                    this.history.add(new ResizeRowCommand(row, row.height, handler["resizeState"].startSize));
            }
        }
        
        // clear the resize state resize complete and mouse up
        handler["resizeState"] = null;

        // clear the isSelectingRange variable after complete selection and mouse up
        handler["isSelectingRange"] = false;
    }

    // this is to handle double click event
    public handleDoubleClick(e: MouseEvent, selection: SelectionState | null): void 
    {
        // if nothing is selection and double click or if row or cloumn select and double click than return
        if (!selection || selection.type !== "cell") 
            return;

        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < this.viewport.headerWidth || y < this.viewport.headerHeight) 
            return;

        // get row and column
        const colIndex = this.workbook.columns.findIndex(c => c.name === selection.colName);
        const rowIndex = this.workbook.rows.findIndex(r => r.id === selection.rowId);
        const row = this.workbook.rows[rowIndex];
        const col = this.workbook.columns[colIndex];

        if (row && col) 
        {
            // get cell
            const cell = this.workbook.getCell(row.id, col.name);
            if (cell) 
            {
                const cellX = rect.left + this.viewport.headerWidth + this.renderer.getColX(this.workbook, colIndex) - this.viewport.scrollX;
                const cellY = rect.top + this.viewport.headerHeight + this.renderer.getRowY(this.workbook, rowIndex) - this.viewport.scrollY;
                this.editor.show(cell, cellX, cellY, col.width, row.height, cell.text ? "append" : "override");
            }
        }
    }
}