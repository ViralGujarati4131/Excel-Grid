import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";

export class ReachDataBoundry
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer
    ){}

    public jumpToDataBoundary(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        if (!handler.selection || handler.selection.startRowIdx === undefined || handler.selection.startColIdx === undefined) 
            return;

        let currentR = handler.selection.startRowIdx;
        let currentC = handler.selection.startColIdx;

        const checkCellFilled = (rIdx: number, cIdx: number): boolean => 
        {
            const row = this.workbook.rows[rIdx];

            const col = this.workbook.columns[cIdx];

            if (!row || !col) 
                return false;

            const cell = this.workbook.getCell(row.id, col.name);

            return Boolean(cell && cell.text.trim().length > 0);
        };

        let firstNextR = currentR + rowDelta;
        let firstNextC = currentC + colDelta;

        // if it goes to out of boundry return it
        if (firstNextR < 0 || firstNextR >= this.workbook.rows.length || firstNextC < 0 || firstNextC >= this.workbook.columns.length)
            return;

        const isCurrentFilled = checkCellFilled(currentR, currentC);
        const isNextFilled = checkCellFilled(firstNextR, firstNextC);
        let lookForFilled: boolean;
        
        if (isCurrentFilled && !isNextFilled) 
        {
            // if current is filled and next is not filled
            currentR = firstNextR;
            currentC = firstNextC;

            // cuurent is filled and next is not so we need to continue to find end bound
            lookForFilled = true; 
        } 
        else if (isCurrentFilled && isNextFilled) 
        {
            //  if current and next both are filled

            // next is also filled so need to find end bound
            lookForFilled = false; 
        } 
        else 
        {
            // if current is not filled

            // look for end bound
            lookForFilled = true; 
        }

        while (true) 
        {
            let nextR = currentR + rowDelta;
            let nextC = currentC + colDelta;

            // check until the current limits of workbook
            if (nextR < 0 || nextR >= this.workbook.rows.length || nextC < 0 || nextC >= this.workbook.columns.length) 
                break;

            const nextFilled = checkCellFilled(nextR, nextC);

            if (lookForFilled) 
            {
                if (nextFilled) 
                {
                    currentR = nextR;
                    currentC = nextC;
                    break;
                }
            } 
            else 
            {
                if (!nextFilled) 
                {
                    break;
                }
            }

            currentR = nextR;
            currentC = nextC;

            if (rowDelta !== 0 && (currentR === 0 || currentR === this.workbook.rows.length - 1)) break;
            if (colDelta !== 0 && (currentC === 0 || currentC === this.workbook.columns.length - 1)) break;
        }

        // apply selection to last filled or last cell in row or column
        const targetRow = this.workbook.rows[currentR];
        const targetCol = this.workbook.columns[currentC];

        if (targetRow && targetCol) 
        {
            handler.selection = {
                type: "cell",
                rowId: targetRow.id,
                colName: targetCol.name,
                startRowIdx: currentR,
                startColIdx: currentC,
                endRowIdx: currentR,
                endColIdx: currentC
            };
            adjustViewportToCell(currentR, currentC, this.renderer, this.workbook, this.viewport);
            handler.updateView();
        }
    }

}