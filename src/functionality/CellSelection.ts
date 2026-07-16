import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";

export class CellSelection
{
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer
    )
    {}

    public cellSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
    {
        const row = this.workbook.rows[indices.rowIdx];
        const col = this.workbook.columns[indices.colIdx];
        if (row && col) 
        {
            handler.cellState = {
                rowId: row.id,
                colName: col.name,
                startRowIdx: indices.rowIdx,
                startColIdx: indices.colIdx,
                endRowIdx: indices.rowIdx,
                endColIdx: indices.colIdx,
                activeRowIdx: indices.rowIdx,
                activeColIdx: indices.colIdx
            }
        }
        handler.updateView();
    }

    public cellRangeSelection(handler: InteractionHandler,x: number,y: number,width: number,height: number)
    {   
        if(!handler.cellState)
            return;

        if(handler.cellState.endColIdx >= this.workbook.columns.length - 5)
            this.workbook.expandColumns(10);

        if(handler.cellState.endRowIdx >= this.workbook.rows.length - 5)
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
        if(indices)
        {
            handler.cellState.endRowIdx = indices.rowIdx;
            handler.cellState.endColIdx = indices.colIdx;
        }
        adjustViewportToCell(handler.cellState.endRowIdx!, handler.cellState.endColIdx!, this.renderer, this.workbook, this.viewport);
        handler.updateView();
    }
}