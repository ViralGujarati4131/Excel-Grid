import type { CellEditor } from "../components/CellEditor.js";
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
        private history: CommandHistory,
        private editor: CellEditor
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

    public setResizeState(e: MouseEvent,handler: InteractionHandler)
    {
        if (!handler["hoverResizeInfo"])
            return;
    
        // column resize
        if (handler["hoverResizeInfo"].type === "column") 
        {
            const col = this.workbook.columns[handler["hoverResizeInfo"].index];
            if (col) 
            {
                handler["resizeState"] = {
                    type: "column",
                    index: handler["hoverResizeInfo"].index,
                    startPos: e.clientX,
                    startSize: col.width
                };
            }
        } 
        else 
        {
            // row resize
            const row = this.workbook.rows[handler["hoverResizeInfo"].index];
            if (row) 
            {
                handler["resizeState"] = {
                    type: "row",
                    index: handler["hoverResizeInfo"].index,
                    startPos: e.clientY,
                    startSize: row.height
                };
            }
        }
        this.editor.hide();
            
    }
    
    public storeResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
         if(!handler["resizeState"])
            return;

        if (handler["resizeState"].type === "column") 
        {        
            const deltaX = e.clientX - handler["resizeState"].startPos;
            const col = this.workbook.columns[handler["resizeState"].index];

            if (col) 
                col.width = Math.max(30, handler["resizeState"].startSize + deltaX);
        } 
        else 
        {
            const deltaY = e.clientY - handler["resizeState"].startPos;
            const row = this.workbook.rows[handler["resizeState"].index];

            if (row) 
                row.height = Math.max(15, handler["resizeState"].startSize + deltaY);
        }
        handler.updateView();
    }

     public SaveResizeValue(handler: InteractionHandler)
    {
        if(!handler["resizeState"])
            return;

        if (handler["resizeState"].type === "column") 
        {
            const col = this.workbook.columns[handler["resizeState"].index];

            if (col && col.width !== handler["resizeState"].startSize) 
                this.history.add(new ResizeColumnCommand(col, col.width, handler["resizeState"].startSize));
        } 
        else 
        {
            // row resize
            const row = this.workbook.rows[handler["resizeState"].index];

            if (row && row.height !== handler["resizeState"].startSize) 
                this.history.add(new ResizeRowCommand(row, row.height, handler["resizeState"].startSize));
        }
    }
}