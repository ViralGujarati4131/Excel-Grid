import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { ColumnAttributes, RowAttributes } from "../utils/Constants.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";

export class CellRangeSelection
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ){}

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
        if (rowDelta == 0 && newEndColIdx >= this.workbook.columns.length - 5) 
            this.workbook.expandColumns(ColumnAttributes.Expand_30_Column);

        // while select the row or cell if near to end row or column expand row and column
        if (colDelta == 0 && newEndRowIdx >= this.workbook.rows.length - 5) 
            this.workbook.expandRows(RowAttributes.Expand_50_Row);

        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        handler.selection.endRowIdx = newEndRowIdx;
        handler.selection.endColIdx = newEndColIdx;

        adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        handler.updateView();
    }

    public rangeSelectionUsingPointer(e: PointerEvent, handler: InteractionHandler, x: number, y: number, width: number, height: number)
    {
        if (handler.isSelectingRange && handler.selection && handler.selection.endColIdx !== undefined && handler.selection.endRowIdx !== undefined && handler.selection.startRowIdx !== undefined && handler.selection.startColIdx !== undefined) 
        {
            const dragType = handler.dragSelectionType;

            if (dragType !== "row" && handler.selection.endColIdx >= this.workbook.columns.length - 5) {
                this.workbook.expandColumns(ColumnAttributes.Expand_30_Column);
            }
            
            if (dragType !== "column" && handler.selection.endRowIdx >= this.workbook.rows.length - 5) {
                this.workbook.expandRows(RowAttributes.Expand_50_Row);
            }

            if (x >= width - ColumnAttributes.EdgeMargin) 
            {
                this.viewport.scrollX += ColumnAttributes.EdgeMargin;
            } 
            else if (x <= this.viewport.headerWidth + ColumnAttributes.EdgeMargin && this.viewport.scrollX > 0) 
            {
                this.viewport.scrollX = Math.max(0, this.viewport.scrollX - ColumnAttributes.EdgeMargin);
            }

            if (y >= height - RowAttributes.EdgeMargin) 
            {
                this.viewport.scrollY += RowAttributes.EdgeMargin;
            } 
            else if (y <= this.viewport.headerHeight + RowAttributes.EdgeMargin && this.viewport.scrollY > 0) 
            {
                this.viewport.scrollY = Math.max(0, this.viewport.scrollY - RowAttributes.EdgeMargin);
            }

            const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
            if (indices) 
            {
                if (handler.selection.activeRowIdx === undefined) {
                    handler.selection.activeRowIdx = handler.selection.startRowIdx;
                }
                if (handler.selection.activeColIdx === undefined) {
                    handler.selection.activeColIdx = handler.selection.startColIdx;
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
                adjustViewportToCell(handler.selection.endRowIdx, handler.selection.endColIdx, this.renderer, this.workbook, this.viewport);
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