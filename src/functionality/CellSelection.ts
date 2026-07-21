import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";

export class CellSelection
{
    constructor(
        private workbook: Workbook
    )
    {}

    public CellSelect(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
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
}