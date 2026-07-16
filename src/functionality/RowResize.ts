import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeRowCommand } from "../undoRedo/commands/ResizeRowCommand.js";

export class RowResize
{
    constructor(
        private workbook: Workbook,
        private history: CommandHistory,
        private editor: CellEditor
    )
    {}

    public SetRowResizeState(e: MouseEvent,handler: InteractionHandler)
    {
        if (!handler["rowHoverResizeInfo"])
            return;
    
        // row resize
        const row = this.workbook.rows[handler["rowHoverResizeInfo"].index];
        if (row) 
        {
            handler["rowResizeState"] = {
                index: handler["rowHoverResizeInfo"].index,
                startPos: e.clientY,
                startSize: row.height
            }
        }
        this.editor.hide();   
    }
    
    public StoreRowResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
        if(!handler["rowResizeState"])
            return;

        const deltaY = e.clientY - handler["rowResizeState"].startPos;
        const row = this.workbook.rows[handler["rowResizeState"].index];

        if (row) 
            row.height = Math.max(15, handler["rowResizeState"].startSize + deltaY);
        handler.updateView();
    }

    public SaveRowResizeValue(handler: InteractionHandler)
    {
        if(!handler["rowResizeState"])
            return;

        // row resize
        const row = this.workbook.rows[handler["rowResizeState"].index];

        if (row && row.height !== handler["rowResizeState"].startSize) 
            this.history.add(new ResizeRowCommand(row, row.height, handler["rowResizeState"].startSize));
    }
}