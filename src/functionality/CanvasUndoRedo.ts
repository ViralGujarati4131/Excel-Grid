import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";

export class CanvasUndoRedo
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
        private history: CommandHistory
    )
    {}

    public canvasUndo(e: KeyboardEvent,handler: InteractionHandler)
    {
        const lastCommand = (this.history as any).undoStack?.[(this.history as any).undoStack.length - 1];           
        if (this.history.undo()) 
        {

            // if text is undo that time only execute
            // this is just to move selection with the undo
            if (lastCommand && lastCommand instanceof WriteTextCommand) 
            {
                const row = this.workbook.rows[lastCommand.rowIdx];
                const col = this.workbook.columns[lastCommand.colIdx];

                if (row && col) 
                {
                    handler.selection = {
                        type: "cell", 
                        rowId: row.id, 
                        colName: col.name,
                        startRowIdx: lastCommand.rowIdx, 
                        startColIdx: lastCommand.colIdx,
                        endRowIdx: lastCommand.rowIdx, 
                        endColIdx: lastCommand.colIdx
                    };
                    adjustViewportToCell(lastCommand.rowIdx, lastCommand.colIdx, this.renderer, this.workbook, this.viewport);
                }
            }


            // to update the view after undo
            (handler as any).updateView();
        }
        e.preventDefault();
        return;
    }

    public canvasRedo(e: KeyboardEvent,handler: InteractionHandler)
    {
        const nextCommand = (this.history as any).redoStack?.[(this.history as any).redoStack.length - 1];
        if (this.history.redo()) 
        {

            // if text is redo that time only execute
            // this just to move the selection with the redo
            if (nextCommand && nextCommand instanceof WriteTextCommand) 
            {
                const row = this.workbook.rows[nextCommand.rowIdx];
                const col = this.workbook.columns[nextCommand.colIdx];

                if (row && col) 
                {
                    handler.selection = {
                        type: "cell", 
                        rowId: row.id, 
                        colName: col.name,
                        startRowIdx: nextCommand.rowIdx, 
                        startColIdx: nextCommand.colIdx,
                        endRowIdx: nextCommand.rowIdx, 
                        endColIdx: nextCommand.colIdx
                    };
                    adjustViewportToCell(nextCommand.rowIdx, nextCommand.colIdx, this.renderer, this.workbook, this.viewport);
                }
            }
            
            // to update the view after redo
            (handler as any).updateView();
        }
        e.preventDefault();
        return;
    }

}