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
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ){}

    public columnSelection(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
    {
        if (indices.colIdx !== -1) 
        {
            const col = this.workbook.columns[indices.colIdx];
            if (col) 
            {
                handler.dragSelectionType = "column";
                handler.selection = {
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

    public rowSelection(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
    {
        if (indices.rowIdx !== -1) 
        {
            const row = this.workbook.rows[indices.rowIdx];
            if (row) 
            {
                handler.dragSelectionType = "row";
                handler.selection = {
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

    public cellSelection(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
    {
        const row = this.workbook.rows[indices.rowIdx];
        const col = this.workbook.columns[indices.colIdx];
        if (row && col) 
        {
            handler.dragSelectionType = "cell";
            handler.selection = {
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
        if (newEndColIdx >= this.workbook.columns.length - 5) 
            this.workbook.expandColumns(10);

        // while select the row or cell if near to end row or column expand row and column
        if (newEndRowIdx >= this.workbook.rows.length - 5) 
            this.workbook.expandRows(50);

        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        handler.selection.endRowIdx = newEndRowIdx;
        handler.selection.endColIdx = newEndColIdx;

        adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        handler.updateView();
    }

    public rangeSelectionUsingPointer(e: PointerEvent, handler: InteractionHandler, x: number, y: number, width: number, height: number)
    {
        if (handler.isSelectingRange && handler.selection) 
        {
            const dragType = handler.dragSelectionType;

            if (dragType !== "row" && handler.selection.endColIdx! >= this.workbook.columns.length - 5) {
                this.workbook.expandColumns(10);
            }
            
            if (dragType !== "column" && handler.selection.endRowIdx! >= this.workbook.rows.length - 5) {
                this.workbook.expandRows(50);
            }

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

                if (dragType === "column" && indices.colIdx !== -1) 
                {
                    handler.selection.endColIdx = indices.colIdx;
                    handler.selection.endRowIdx = this.workbook.rows.length - 1; 
                } 
                else if (dragType === "row" && indices.rowIdx !== -1) 
                {
                    handler.selection.endRowIdx = indices.rowIdx;
                    handler.selection.endColIdx = this.workbook.columns.length - 1; 
                } 
                else if (dragType === "cell" && indices.rowIdx !== -1 && indices.colIdx !== -1) 
                {
                    handler.selection.endRowIdx = indices.rowIdx;
                    handler.selection.endColIdx = indices.colIdx;
                }
                adjustViewportToCell(handler.selection.endRowIdx!, handler.selection.endColIdx!, this.renderer, this.workbook, this.viewport);
                handler.updateView();
            }
        }
    }

    public clearSelection(handler: InteractionHandler)
    {
        handler.selection = null;
        handler.dragSelectionType = "cell";
        this.editor.hide();
        handler.updateView();
    }
}