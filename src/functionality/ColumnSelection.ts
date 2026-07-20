import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";

export class ColumnSelection 
{
    constructor(
        private workbook: Workbook
    )
    {}

     public ColumnSelect(indices: {rowIdx: number, colIdx: number}, handler: InteractionHandler)
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
}