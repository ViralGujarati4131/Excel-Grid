import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";
import type { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";

export class CellEditing
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
        private editor: CellEditor,
        private history: CommandHistory
    ){}

    // render the inputBox on cell
    public ActiveCell(handler: InteractionHandler,e: KeyboardEvent | MouseEvent)
    {
        // Delete when cell is only select not active

        if (
            !handler.selection ||
            e.ctrlKey || 
            e.altKey || 
            e.shiftKey || 
            (e instanceof KeyboardEvent && (e.key == "Insert" 
                || e.key == "Enter" 
                || e.key == "Escape" 
                || e.key == "AltGraph"
                || e.key == "F1"
                || e.key == "F3"
                || e.key == "F4"
                || e.key == "F5"
                || e.key == "F6"
                || e.key == "F7"
                || e.key == "F8"
                || e.key == "F9" 
                || e.key == "F10"
                || e.key == "F11"
                || e.key == "F12"
                || e.key == "Backspace"
                || e.key == "Pause"
                || e.key == "Home"
                || e.key == "End"
                || e.key == "NumLock"
                || e.key == "CapsLock"
                || e.key == "Tab")))
        {
            return;
        } 

        const validTypes = ["cell", "range", "columnRange", "rowRange", "row","column"];
        if (!validTypes.includes(handler.selection.type)) {
            return;
        }

        const rect = this.renderer.getCanvasElement().getBoundingClientRect();

        if(e instanceof MouseEvent)
        {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // if outside canvas the double click happen
            if (x < this.viewport.headerWidth || y < this.viewport.headerHeight) 
                return;
        }

        const rowIndex = handler.selection.activeRowIdx !== undefined 
            ? handler.selection.activeRowIdx 
            : (handler.selection.startRowIdx);
            
        const colIndex = handler.selection.activeColIdx !== undefined 
            ? handler.selection.activeColIdx 
            : (handler.selection.startColIdx);

        if (colIndex !== undefined && rowIndex !== undefined) 
        {
            // get row and column
            const row = this.workbook.rows[rowIndex];   
            const col = this.workbook.columns[colIndex];
            if (row && col) 
            {
                // get cell
                const cell = this.workbook.getCell(row.id, col.name);
                if (cell) 
                {
                    const cellX = rect.left + this.viewport.headerWidth + this.renderer.getColX(this.workbook, colIndex) - this.viewport.scrollX;
                    const cellY = rect.top + this.viewport.headerHeight + this.renderer.getRowY(this.workbook, rowIndex) - this.viewport.scrollY;
                    this.editor.show(cell, cellX, cellY, col.width, row.height, cell.text ? "append" : "override");
                    if(e instanceof KeyboardEvent && e.key != "F2")
                    {
                        this.editor.setValue(e.key);
                        e.preventDefault();
                    }
                }
            }
        } 
    }

    // this is use to save the input value
    public saveEditorContent(handler: InteractionHandler): void 
    {   
        if (handler.selection)
        {
            const rIdx = handler.selection.activeRowIdx ?? handler.selection.startRowIdx;
            const cIdx = handler.selection.activeColIdx ?? handler.selection.startColIdx;
             
            if(rIdx !== undefined && cIdx !== undefined)
            {
                const row = this.workbook.rows[rIdx];
                const col = this.workbook.columns[cIdx];

                const cell = this.workbook.getCell(row!.id, col!.name);

                if (cell) 
                {
                    const oldText = cell.text;
                    const newText = this.editor.getValue();
                    
                    // store the written text as a command for maintain undo redo state
                    if (oldText !== newText) 
                    {
                        const cmd = new WriteTextCommand(cell, newText, oldText, rIdx,cIdx);
                        cmd.execute();
                        this.history.add(cmd);
                    }
                }
            }
        }
        this.editor.hide();
        handler.updateView();
    }
    

    public CancelCellEditing(e: KeyboardEvent,handler: InteractionHandler)
    {
        if (this.editor.getElement().style.display !== "none") 
        {
            const originalText = this.editor.getInitialValue();
            this.editor.setValue(originalText);
            this.editor.hide();
            handler.updateView();
            e.preventDefault();
            return;
        }
    }

}