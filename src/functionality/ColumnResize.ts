import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { ResizeColumnCommand } from "../undoRedo/commands/ResizeColumnCommand.js";
import { ColumnAttributes, ColumnHoverInfoCheck, ColumnResizeCheck } from "../utils/Constants.js";

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
        if (!handler[ColumnHoverInfoCheck])
            return;
    
        const col = this.workbook.columns[handler[ColumnHoverInfoCheck].index];
        if (col) 
        {
            handler[ColumnResizeCheck] = {
                index: handler[ColumnHoverInfoCheck].index,
                startPos: e.clientX,
                startSize: col.width
            };
        }
        this.editor.hide();   
    }
    
    public StoreColumnResizeValue(e: MouseEvent,handler: InteractionHandler)
    {
         if(!handler[ColumnResizeCheck])
            return;
  
        const deltaX = e.clientX - handler[ColumnResizeCheck].startPos;
        const col = this.workbook.columns[handler[ColumnResizeCheck].index];

        if (col) 
            col.width = Math.max(ColumnAttributes.MinWidth, handler["columnResizeState"].startSize + deltaX);
        handler.updateView();
    }

    public SaveColumnResizeValue(handler: InteractionHandler)
    {
        if(!handler[ColumnResizeCheck])
            return;

        const col = this.workbook.columns[handler[ColumnResizeCheck].index];

        if (col && col.width !== handler[ColumnResizeCheck].startSize) 
            this.history.add(new ResizeColumnCommand(col, col.width, handler[ColumnResizeCheck].startSize));
    }
}