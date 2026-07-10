import type { CellEditor } from "../components/CellEditor.js";
import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";

export class CellEditing
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
        private editor: CellEditor
    ){}

    // render the inputBox on cell
    public ActiveCell(handler: InteractionHandler,e: KeyboardEvent | MouseEvent)
    {
        // Delete when cell is only select not active

        if (
            !handler.selection || 
            handler.selection.type !== "cell" || 
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
                || e.key == "F12")))
        {
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

        // get row and column index
        const colIndex = this.workbook.columns.findIndex(c => c.name === handler.selection!.colName);
        const rowIndex = this.workbook.rows.findIndex(r => r.id === handler.selection!.rowId);

         if (colIndex !== -1 && rowIndex !== -1) 
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

    public CancelCellEditing(e: KeyboardEvent,handler: InteractionHandler)
    {
        if (this.editor.getElement().style.display !== "none") 
        {
            const originalText = this.editor.getInitialValue();
            this.editor.setValue(originalText);
            this.editor.hide();
            (handler as any).updateView();
            e.preventDefault();
            return;
        }
    }

}