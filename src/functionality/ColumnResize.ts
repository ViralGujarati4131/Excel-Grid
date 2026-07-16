import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeColumnCommand } from "../undoRedo/commands/ResizeColumnCommand.js";

export class ColumnResize
{
    constructor(
        private workbook: Workbook,
        private history: CommandHistory,
        private editor: CellEditor
    )
    {}

    public SetColumnResizeState(e: MouseEvent,handler: InteractionHandler)
    {
        if (!handler["columnHoverResizeInfo"])
            return;
    
        const col = this.workbook.columns[handler["columnHoverResizeInfo"].index];
        if (col) 
        {
            handler["columnResizeState"] = {
                index: handler["columnHoverResizeInfo"].index,
                startPos: e.clientX,
                startSize: col.width
            };
        }
        this.editor.hide();   
    }
    
    public StoreColumnResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
         if(!handler["columnResizeState"])
            return;
  
        const deltaX = e.clientX - handler["columnResizeState"].startPos;
        const col = this.workbook.columns[handler["columnResizeState"].index];

        if (col) 
            col.width = Math.max(30, handler["columnResizeState"].startSize + deltaX);
        handler.updateView();
    }

    public SaveColumnResizeValue(handler: InteractionHandler)
    {
        if(!handler["columnResizeState"])
            return;

        const col = this.workbook.columns[handler["columnResizeState"].index];

        if (col && col.width !== handler["columnResizeState"].startSize) 
            this.history.add(new ResizeColumnCommand(col, col.width, handler["columnResizeState"].startSize));
    }
}