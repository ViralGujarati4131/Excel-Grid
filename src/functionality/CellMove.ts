import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { getNextCellWithinRange } from "../utils/getNextCellInRange.js";

export class CellMove
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer
    ){}

    // normal move in grid
    public moveSelection(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        // if nothing is selection return
        if (!handler.selection || handler.selection.startRowIdx === undefined || handler.selection.startColIdx === undefined) 
            return;
        
        // set new row column id
        let newRowIdx = handler.selection.startRowIdx + rowDelta;
        let newColIdx = handler.selection.startColIdx + colDelta;

        // after move if it come near to end at scroll expand row
        if (newRowIdx >= this.workbook.rows.length - 5) 
            this.workbook.expandRows(50);

        // after move if it come near to end at scroll expand column
        if (newColIdx >= this.workbook.columns.length - 3) 
            this.workbook.expandColumns(10);

        // to handle minus index condition
        newRowIdx = Math.max(0, Math.min(newRowIdx, this.workbook.rows.length - 1));
        newColIdx = Math.max(0, Math.min(newColIdx, this.workbook.columns.length - 1));

        // new row col of cell
        const row = this.workbook.rows[newRowIdx];
        const col = this.workbook.columns[newColIdx];

        if (row && col) 
        {
            handler.selection = {
                type: "cell", rowId: row.id, 
                colName: col.name,
                startRowIdx: newRowIdx, 
                startColIdx: newColIdx,
                endRowIdx: newRowIdx, 
                endColIdx: newColIdx
            };
            // make view port visible if cell selection go out of visible boundry
            adjustViewportToCell(newRowIdx, newColIdx, this.renderer, this.workbook, this.viewport);
            handler.updateView();
        }
    }

    public moveSelectionInsideRange(handler: InteractionHandler)
    {
        if (!handler.selection || handler.selection.type == "cell") 
            return;

        const nextCell = getNextCellWithinRange(
            handler.selection, 1, 0, handler.workbook.rows.length, handler.workbook.columns.length
        );
        
        handler.selection.activeRowIdx = nextCell.rowIdx;
        handler.selection.activeColIdx = nextCell.colIdx;
        
        const nextRow = handler.workbook.rows[nextCell.rowIdx];
        const nextCol = handler.workbook.columns[nextCell.colIdx];
        
        if (nextRow && nextCol) {
            handler.selection.rowId = nextRow.id;
            handler.selection.colName = nextCol.name;
        }

        adjustViewportToCell(nextCell.rowIdx, nextCell.colIdx, this.renderer, handler.workbook, this.viewport); //
        handler.updateView();
    }

}