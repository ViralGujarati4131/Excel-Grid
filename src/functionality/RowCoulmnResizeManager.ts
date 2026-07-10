import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler, ResizeState } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeColumnCommand } from "../undoRedo/commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "../undoRedo/commands/ResizeRowCommand.js";

export class RowColumnResizeManager
{
    private tolerance = 5;
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private canvas: HTMLCanvasElement,
        private history: CommandHistory
    )
    {}

    public checkHoverEdge(x: number, y: number): { type: "row" | "column"; index: number } | null 
    {
            // cloumn
        if (y < this.viewport.headerHeight && x > this.viewport.headerWidth) 
        {
            for (let c = 0; c < this.workbook.columns.length; c++) 
            {
                const edgeX = this.viewport.headerWidth + this.renderer.getColX(this.workbook, c + 1) - this.viewport.scrollX;

                if (Math.abs(x - edgeX) <= this.tolerance) 
                {
                    this.canvas.style.cursor = "col-resize";
                    return { type: "column", index: c };
                }
            }
        }

        // row
        if (x < this.viewport.headerWidth && y > this.viewport.headerHeight) 
        {
            for (let r = 0; r < this.workbook.rows.length; r++) 
            {
                const edgeY = this.viewport.headerHeight + this.renderer.getRowY(this.workbook, r + 1) - this.viewport.scrollY;

                if (Math.abs(y - edgeY) <= this.tolerance) 
                {
                    this.canvas.style.cursor = "row-resize";
                    return { type: "row", index: r };
                }
            }
        }

        this.canvas.style.cursor = "default";
        return null;
    }


    public SaveResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
        if(!handler["resizeState"])
            return;

        if (handler["resizeState"].type === "column") 
        {
            const col = this.workbook.columns[handler["resizeState"].index];

            if (col && col.width !== handler["resizeState"].startSize) 
            {
                // if(e instanceof MouseEvent)
                // {
                //     const deltaX = e.clientX - handler["resizeState"].startPos;
                //     col.width = Math.max(30, handler["resizeState"].startSize + deltaX);
                //     return;
                // }
                this.history.add(new ResizeColumnCommand(col, col.width, handler["resizeState"].startSize));
            }
        } 
        else 
        {
            // row resize
            const row = this.workbook.rows[handler["resizeState"].index];

            if (row && row.height !== handler["resizeState"].startSize) 
            {
                // if(e instanceof MouseEvent)
                // {
                //     const deltaX = e.clientX - handler["resizeState"].startPos;
                //     row.height = Math.max(30, handler["resizeState"].startSize + deltaX);
                //     return;
                // }
                this.history.add(new ResizeRowCommand(row, row.height, handler["resizeState"].startSize));
            }
        }
    }
    
}