import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";

export class CellRangeSelection
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
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

        if(handler.selection.type === "cell" || handler.selection.type === "range")
        {
            // if near to end row or column expand row and column
            if (newEndRowIdx >= this.workbook.rows.length - 5) 
                this.workbook.expandRows(50);

            if (newEndColIdx >= this.workbook.columns.length - 3) 
                this.workbook.expandColumns(10);
        }

        // handle the minus case 
        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        handler.selection.endRowIdx = newEndRowIdx;
        handler.selection.endColIdx = newEndColIdx;

        if(handler.selection.type === "row" || handler.selection.type === "rowRange")
        {
            handler.selection.type = "rowRange"
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        else if(handler.selection.type === "column" || handler.selection.type === "columnRange")
        {
            handler.selection.type = "columnRange"
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        else
        {
            handler.selection.type = (handler.selection.startRowIdx === handler.selection.endRowIdx 
                && handler.selection.startColIdx === handler.selection.endColIdx) ? "cell" : "range";
                
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        (handler as any).updateView();
    }
}