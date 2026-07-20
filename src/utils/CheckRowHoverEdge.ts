import type { Workbook } from "../core/Workbook.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import { DefaultCursorType, RowAttributes } from "./Constants.js";

export function CheckRowHoverEdge(x: number, y: number, viewport: Viewport,renderer: CanvasRenderer,workbook: Workbook,canvas: HTMLCanvasElement): { index: number } | null 
{
    const tolerance = 5;
    // row
    if (x < viewport.headerWidth && y > viewport.headerHeight) 
    {
        for (let r = 0; r < workbook.rows.length; r++) 
        {
            const edgeY = viewport.headerHeight + renderer.getRowY(workbook, r + 1) - viewport.scrollY;

            if (Math.abs(y - edgeY) <= tolerance) 
            {
                canvas.style.cursor = RowAttributes.CursorType;
                return { index: r };
            }
        }
    }
    canvas.style.cursor = DefaultCursorType;
    return null;
}