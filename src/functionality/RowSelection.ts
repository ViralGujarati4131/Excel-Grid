import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";

export class RowSelection
{
    constructor(
        private workbook: Workbook
    )
    {}

    public RowSelect(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
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
}