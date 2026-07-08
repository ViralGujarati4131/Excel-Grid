import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CanvasRenderer } from "../rendering/CanvasRenderer.js";

export class RowColumnResizeManage 
{
    private tolerance = 5;

    // this will change the cursor when cursor near the row or column edge
    public checkHoverEdge(
        x: number, 
        y: number, 
        workbook: Workbook, 
        viewport: Viewport, 
        renderer: CanvasRenderer, 
        canvas: HTMLCanvasElement
    ): { type: "row" | "column"; index: number } | null 
    {
         // cloumn
        if (y < viewport.headerHeight && x > viewport.headerWidth) 
        {
            for (let c = 0; c < workbook.columns.length; c++) 
            {
                const edgeX = viewport.headerWidth + renderer.getColX(workbook, c + 1) - viewport.scrollX;

                if (Math.abs(x - edgeX) <= this.tolerance) 
                {
                    canvas.style.cursor = "col-resize";
                    return { type: "column", index: c };
                }
            }
        }

        // row
        if (x < viewport.headerWidth && y > viewport.headerHeight) 
        {
            for (let r = 0; r < workbook.rows.length; r++) 
            {
                const edgeY = viewport.headerHeight + renderer.getRowY(workbook, r + 1) - viewport.scrollY;

                if (Math.abs(y - edgeY) <= this.tolerance) 
                {
                    canvas.style.cursor = "row-resize";
                    return { type: "row", index: r };
                }
            }
        }

        canvas.style.cursor = "default";
        return null;
    }
}