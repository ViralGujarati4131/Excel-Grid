import type { Workbook } from "../core/Workbook.js";
import type { Viewport } from "../rendering/Viewport.js";

// get row and column id from x and y position
export function getCellByCoordination(x: number, y: number,viewport: Viewport, workbook: Workbook): { rowIdx: number; colIdx: number } | null 
{
    // find rowId
    let runningY = viewport.headerHeight;
    let rowIdx = -1;
    for (let r = 0; r < workbook.rows.length; r++) 
    {
        const row = workbook.rows[r];

        if (!row) 
            continue;

        if (y >= runningY - viewport.scrollY && y < runningY + row.height - viewport.scrollY) 
        {
            rowIdx = r;
            break;
        }
        runningY += row.height;
    }

    // find columnId
    let runningX = viewport.headerWidth;
    let colIdx = -1;
    for (let c = 0; c < workbook.columns.length; c++) 
    {
        const col = workbook.columns[c];

        if (!col) 
            continue;

        if (x >= runningX - viewport.scrollX && x < runningX + col.width - viewport.scrollX) 
        {
            colIdx = c;
            break;
        }
        runningX += col.width;
    }
    return { rowIdx, colIdx };
}
