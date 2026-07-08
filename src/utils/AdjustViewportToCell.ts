import type { Workbook } from "../core/Workbook.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";

export function adjustViewportToCell(rowIdx: number, colIdx: number,renderer: CanvasRenderer,workbook: Workbook,viewport: Viewport): void 
{
    const canvas = renderer.getCanvasElement();
    
    const cellLeft = renderer.getColX(workbook, colIdx);
    const col = workbook.columns[colIdx];
    const cellRight = cellLeft + (col ? col.width : 100);

    const cellTop = renderer.getRowY(workbook, rowIdx);
    const row = workbook.rows[rowIdx];
    const cellBottom = cellTop + (row ? row.height : 30);

    const viewWidth = canvas.width - viewport.headerWidth;
    const viewHeight = canvas.height - viewport.headerHeight;

    if (cellLeft < viewport.scrollX) 
    {
        // after move if left side is cutting than scroll that much right side
        viewport.scrollX = cellLeft;
    } 
    else if (cellRight > viewport.scrollX + viewWidth) 
    {
        // after move if right side is cuttinh than scroll that much left side
        viewport.scrollX = cellRight - viewWidth;
    }

    if (cellTop < viewport.scrollY) 
    {
        // after move if top is cutting than scroll that much below side
        viewport.scrollY = cellTop;
    } 
    else if (cellBottom > viewport.scrollY + viewHeight) 
    {
        // after move if bottom is cutting than scroll that much top side
        viewport.scrollY = cellBottom - viewHeight;
    }

    let totalW = 0;
    for (const c of workbook.columns) 
        totalW += c.width;

    let totalH = 0;
    for (const r of workbook.rows) 
        totalH += r.height;

    viewport.clamp(totalW, totalH, canvas.width, canvas.height);
}