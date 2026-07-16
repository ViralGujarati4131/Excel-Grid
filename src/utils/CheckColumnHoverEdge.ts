import type { Workbook } from "../core/Workbook.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";

export function CheckColumnHoverEdge(x: number, y: number, viewport: Viewport,renderer: CanvasRenderer,workbook: Workbook,canvas: HTMLCanvasElement): { index: number } | null 
{
    const tolerance = 5;
    // cloumn
    if (y < viewport.headerHeight && x > viewport.headerWidth) 
    {
        for (let c = 0; c < workbook.columns.length; c++) 
        {
            const edgeX = viewport.headerWidth + renderer.getColX(workbook, c + 1) - viewport.scrollX;

            if (Math.abs(x - edgeX) <= tolerance) 
            {
                canvas.style.cursor = "col-resize";
                return { index: c };
            }
        }
    }
    canvas.style.cursor = "default";
    return null;
}