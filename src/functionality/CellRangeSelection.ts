import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";

export class CellRangeSelection
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
        private editor: CellEditor
    ){}

    public columnSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
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
                    endRowIdx: this.workbook.rows.length - 1,
                    activeRowIdx: 0, 
                    activeColIdx: indices.colIdx
                };
            }
        }
        handler.updateView();
    }

    public rowSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
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
                    endColIdx: this.workbook.columns.length - 1,
                    activeRowIdx: indices.rowIdx, 
                    activeColIdx: 0 
                };
            }
        }
        handler.updateView();
    }

    public cellSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
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
                endColIdx: indices.colIdx,
                activeRowIdx: indices.rowIdx,
                activeColIdx: indices.colIdx
            };
        }
        handler.updateView();
    }

    public rangeSelectionUsingKey(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        if (!handler.selection || 
            handler.selection.startRowIdx === undefined || 
            handler.selection.startColIdx === undefined || 
            handler.selection.endRowIdx === undefined || 
            handler.selection.endColIdx === undefined) 
        {
            return;
        }

        let newEndRowIdx = handler.selection.endRowIdx + rowDelta;
        let newEndColIdx = handler.selection.endColIdx + colDelta;

        // while select the column or cell if near to end row or column expand row and column
        const isRowSelection = handler.selection.type === "row" || handler.selection.type === "rowRange";
        if (!isRowSelection && newEndColIdx >= this.workbook.columns.length - 5) 
        {
            this.workbook.expandColumns(10);
        }

        // while select the row or cell if near to end row or column expand row and column
        const isColumnSelection = handler.selection.type === "column" || handler.selection.type === "columnRange";
        if (!isColumnSelection && newEndRowIdx >= this.workbook.rows.length - 5)
        {
            this.workbook.expandRows(50);
        }

        // handle the minus case 
        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        handler.selection.endRowIdx = newEndRowIdx;
        handler.selection.endColIdx = newEndColIdx;

        if (isRowSelection) 
        {
            handler.selection.type = "rowRange";
        } 
        else if (isColumnSelection) 
        {
            handler.selection.type = "columnRange";
        } 
        else 
        {
            handler.selection.type = (handler.selection.startRowIdx === newEndRowIdx && handler.selection.startColIdx === newEndColIdx) 
                ? "cell" 
                : "range";
        }
        adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        handler.updateView();
    }

    public rangeSelectionUsingMouse(e: MouseEvent,handler: InteractionHandler,x: number,y: number,width: number,height: number)
    {
        if (handler["isSelectingRange"] && handler.selection) 
        {

            if (handler["dragSelectionType"] !== "row" && handler.selection.endColIdx! >= this.workbook.columns.length - 5)
                this.workbook.expandColumns(10);

            if (handler["dragSelectionType"] !== "column" && handler.selection.endRowIdx! >= this.workbook.rows.length - 5)
                this.workbook.expandRows(50);

            const edgeMarginForColumn = 80;
            const edgeMarginForRow = 50;

            if (x >= width - edgeMarginForColumn) 
            {
                this.viewport.scrollX += 50;
            } 
            else if (x <= this.viewport.headerWidth + edgeMarginForColumn && this.viewport.scrollX > 0) 
            {
                this.viewport.scrollX = Math.max(0, this.viewport.scrollX - 50);
            }

            if (y >= height - edgeMarginForRow) 
            {
                this.viewport.scrollY += 15;
            } 
            else if (y <= this.viewport.headerHeight + edgeMarginForRow && this.viewport.scrollY > 0) 
            {
                this.viewport.scrollY = Math.max(0, this.viewport.scrollY - 30);
            }

            const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
            if (indices) 
            {

                if (handler.selection.activeRowIdx === undefined) {
                    handler.selection.activeRowIdx = handler.selection.startRowIdx!;
                }
                if (handler.selection.activeColIdx === undefined) {
                    handler.selection.activeColIdx = handler.selection.startColIdx!;
                }   

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
                handler.updateView();
            }
        }
    }

    public clearSelection(handler: InteractionHandler)
    {
        handler.selection = null;
        this.editor.hide();
        handler.updateView();
    }
}