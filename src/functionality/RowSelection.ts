import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";

export class RowSelection
{
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer
    )
    {}

    public rowSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
    {
        if (indices.rowIdx !== -1) 
        {
            const row = this.workbook.rows[indices.rowIdx];
            if (row) 
            {
                handler.rowState = {
                    rowId: row.id,
                    startRowIdx: indices.rowIdx,
                    startColIdx: 0,
                    endRowIdx: indices.rowIdx,
                    endColIdx: this.workbook.columns.length - 1,
                    activeRowIdx: indices.rowIdx,
                    activeColIdx: 0
                }
            }
        }
        handler.updateView();
    }

    public rowRangeSelection(handler: InteractionHandler,x: number,y: number,height: number)
    {
        if(!handler.rowState)
            return;

            if (handler.rowState.endRowIdx >= this.workbook.rows.length - 5)
                this.workbook.expandRows(50);

            const edgeMarginForRow = 50;

            if (y >= height - edgeMarginForRow) 
            {
                this.viewport.scrollY += 15;
            } 
            else if (y <= this.viewport.headerHeight + edgeMarginForRow && this.viewport.scrollY > 0) 
            {
                this.viewport.scrollY = Math.max(0, this.viewport.scrollY - 30);
            }
            
            const indices = getCellByCoordination(x, y, this.viewport, this.workbook);
            if(indices)
                handler.rowState.endRowIdx = indices.rowIdx;

            adjustViewportToCell(handler.rowState.endRowIdx, handler.rowState.endColIdx, this.renderer, this.workbook, this.viewport);
            handler.updateView();
    }
}