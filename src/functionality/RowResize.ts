import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeRowCommand } from "../undoRedo/commands/ResizeRowCommand.js";
import { RowAttributes, RowHoverInfoCheck, RowResizeCheck } from "../utils/Constants.js";

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
        if (!handler[RowHoverInfoCheck])
            return;
    
        // row resize
        const row = this.workbook.rows[handler[RowHoverInfoCheck].index];
        if (row) 
        {
            handler[RowResizeCheck] = {
                index: handler[RowHoverInfoCheck].index,
                startPos: e.clientY,
                startSize: row.height
            }
        }
        this.editor.hide();   
    }
    
    public StoreRowResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
        if(!handler[RowResizeCheck])
            return;

        const deltaY = e.clientY - handler[RowResizeCheck].startPos;
        const row = this.workbook.rows[handler[RowResizeCheck].index];

        if (row) 
            row.height = Math.max(RowAttributes.MinHeight, handler[RowResizeCheck].startSize + deltaY);
        handler.updateView();
    }

    public SaveRowResizeValue(handler: InteractionHandler)
    {
        if(!handler[RowResizeCheck])
            return;

        // row resize
        const row = this.workbook.rows[handler[RowResizeCheck].index];

        if (row && row.height !== handler[RowResizeCheck].startSize) 
            this.history.add(new ResizeRowCommand(row, row.height, handler[RowResizeCheck].startSize));
    }
}