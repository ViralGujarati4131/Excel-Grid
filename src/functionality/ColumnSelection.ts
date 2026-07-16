import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";

export class ColumnSelection{

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer
    )
    {}

    public columnSelection(indices: {rowIdx: number,colIdx: number},handler: InteractionHandler)
    {
        if (indices.colIdx !== -1) 
        {
            const col = this.workbook.columns[indices.colIdx];
            if (col) 
            {
                handler.columnState = {
                    colName: col.name,
                    startRowIdx: indices.rowIdx,
                    startColIdx: indices.colIdx,
                    endRowIdx: this.workbook.rows.length - 1,
                    endColIdx: indices.colIdx,
                    activeRowIdx: 0,
                    activeColIdx: indices.colIdx
                }
            }
        }
        handler.updateView();
    }

    public columnRangeSelection(handler: InteractionHandler,x: number,y: number,width: number)
    {   
        if(!handler.columnState)
            return;

        if(handler.columnState.endColIdx >= this.workbook.columns.length - 5)
            this.workbook.expandColumns(10);

        const edgeMarginForColumn = 80;
                    
        if (x >= width - edgeMarginForColumn) 
        {
            this.viewport.scrollX += 50;
        } 
        else if (x <= this.viewport.headerWidth + edgeMarginForColumn && this.viewport.scrollX > 0) 
        {
            this.viewport.scrollX = Math.max(0, this.viewport.scrollX - 50);
        }

        const indices = getCellByCoordination(x, y, this.viewport, this.workbook);

        if(indices)
            handler.columnState.endColIdx = indices.colIdx;

        adjustViewportToCell(handler.columnState.endRowIdx, handler.columnState.endColIdx, this.renderer, this.workbook, this.viewport);
        handler.updateView();
    }
}