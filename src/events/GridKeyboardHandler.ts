import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { InteractionHandler } from "./InteractionHandler.js";

export class GridKeyboardHandler {
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor,
        private history: CommandHistory
    ) {}

    public handleGlobalKeyDown(e: KeyboardEvent, handler: InteractionHandler): void 
    {

        // to edit the existing text and to edit new cell
        if(e.key === "F2")
        {
            if (!handler.selection || handler.selection.type !== "cell") 
                return;

            // get row and column
            const colIndex = this.workbook.columns.findIndex(c => c.name === handler.selection!.colName);
            const rowIndex = this.workbook.rows.findIndex(r => r.id === handler.selection!.rowId);
            const row = this.workbook.rows[rowIndex];
            const col = this.workbook.columns[colIndex];

            if (row && col) 
            {
                // get cell
                const cell = this.workbook.getCell(row.id, col.name);
                if (cell) 
                {
                    const cellX = this.viewport.headerWidth + this.renderer.getColX(this.workbook, colIndex) - this.viewport.scrollX;
                    const cellY = this.viewport.headerHeight + this.renderer.getRowY(this.workbook, rowIndex) - this.viewport.scrollY;
                    this.editor.show(cell, cellX, cellY, col.width, row.height, cell.text ? "append" : "override");
                }
            }
        }

        // to cancel the writing in cell and to cancel the editing        
        if(e.key === "Escape")
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

        // undo the written text and move selection of cell accordingly
        // column or row resize undo
        if ((e.ctrlKey) && e.key.toLowerCase() === "z") 
        {
            const lastCommand = (this.history as any).undoStack?.[(this.history as any).undoStack.length - 1];           
            if (this.history.undo()) 
            {
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

        // redo the erase text and move selection cell accordingly
        // redo the column or row resize 
        if ((e.ctrlKey) && e.key.toLowerCase() === "y") 
        {
            const nextCommand = (this.history as any).redoStack?.[(this.history as any).redoStack.length - 1];
            if (this.history.redo()) 
            {
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

        if(this.editor.getElement().style.display !== "none")
            return;

        if (handler.selection && (e.key.startsWith("Arrow") || e.key === "Enter")) 
        {
            let rowDelta = 0;
            let colDelta = 0;
            let isArrowKey = e.key.startsWith("Arrow");

            switch (e.key) {
                case "ArrowUp":
                rowDelta = -1;
                colDelta = 0;
                break;

                case "ArrowDown":
                rowDelta = 1;
                colDelta = 0;
                break;

                case "ArrowLeft":
                rowDelta = 0;
                colDelta = -1;
                break;

                case "ArrowRight":
                rowDelta = 0;
                colDelta = 1;
                break;
                
                case "Enter":
                rowDelta = 1;
                colDelta = 0;
                break;
            }

            if (rowDelta !== 0 || colDelta !== 0) 
            {
                if (isArrowKey && e.shiftKey) 
                {
                    // Shift + Arrow Keys -> Expand Range Selection Box
                    this.rangeSelectionUsingKey(rowDelta, colDelta, handler);
                }
                else if (isArrowKey && (e.ctrlKey)) 
                {
                    // Ctrl + Arrow Keys -> Fast Jump to Data Boundary 
                    this.jumpToDataBoundary(rowDelta, colDelta, handler);
                } 
                else 
                {
                    // Single Arrow cell step movement
                    this.moveSelection(rowDelta, colDelta, handler);
                }
                e.preventDefault();
                return;
            }
        }

         // render the inputBox on cell
        if (handler.selection && handler.selection.type === "cell" && !e.ctrlKey && e.key.length === 1 ) 
        {
            const colIndex = this.workbook.columns.findIndex(c => c.name === handler.selection!.colName);
            const rowIndex = this.workbook.rows.findIndex(r => r.id === handler.selection!.rowId);
            const canvasRect = this.renderer.getCanvasElement().getBoundingClientRect();

            if (colIndex !== -1 && rowIndex !== -1) 
            {
                const row = this.workbook.rows[rowIndex];   
                const col = this.workbook.columns[colIndex];
                if (row && col) 
                {
                    const cell = this.workbook.getCell(row.id, col.name);
                    if (cell) 
                    {
                        const cellX = canvasRect.left + this.viewport.headerWidth + this.renderer.getColX(this.workbook, colIndex) - this.viewport.scrollX;
                        const cellY = canvasRect.top + this.viewport.headerHeight + this.renderer.getRowY(this.workbook, rowIndex) - this.viewport.scrollY;

                        this.editor.show(cell, cellX, cellY, col.width, row.height, "override");

                        this.editor.setValue(e.key);
                        e.preventDefault();
                    }
                }
            }
        }
    }

    private moveSelection(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        // if nothing is selection return
        if (!handler.selection || handler.selection.startRowIdx === undefined || handler.selection.startColIdx === undefined) 
            return;
        
        // set new row column id
        let newRowIdx = handler.selection.startRowIdx + rowDelta;
        let newColIdx = handler.selection.startColIdx + colDelta;

        // after move if it come near to end at scroll expand row
        if (newRowIdx >= this.workbook.rows.length - 5) 
            this.workbook.expandRows(50);

        // after move if it come near to end at scroll expand column
        if (newColIdx >= this.workbook.columns.length - 3) 
            this.workbook.expandColumns(10);

        // to handle minus index condition
        newRowIdx = Math.max(0, Math.min(newRowIdx, this.workbook.rows.length - 1));
        newColIdx = Math.max(0, Math.min(newColIdx, this.workbook.columns.length - 1));

        // new row col of cell
        const row = this.workbook.rows[newRowIdx];
        const col = this.workbook.columns[newColIdx];

        if (row && col) 
        {
            handler.selection = {
                type: "cell", rowId: row.id, 
                colName: col.name,
                startRowIdx: newRowIdx, 
                startColIdx: newColIdx,
                endRowIdx: newRowIdx, 
                endColIdx: newColIdx
            };
            // make view port visible if cell selection go out of visible boundry
            adjustViewportToCell(newRowIdx, newColIdx, this.renderer, this.workbook, this.viewport);
            (handler as any).updateView();
        }
    }

    private rangeSelectionUsingKey(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        if (!handler.selection || handler.selection.startRowIdx === undefined || handler.selection.startColIdx === undefined || handler.selection.endRowIdx === undefined || handler.selection.endColIdx === undefined) 
            return;

        let newEndRowIdx = handler.selection.endRowIdx + rowDelta;
        let newEndColIdx = handler.selection.endColIdx + colDelta;

        if(handler.selection.type === "cell" || handler.selection.type === "range")
        {
            // if near to end row or column expand row and column
            if (newEndRowIdx >= this.workbook.rows.length - 5) 
                this.workbook.expandRows(50);

            if (newEndColIdx >= this.workbook.columns.length - 3) 
                this.workbook.expandColumns(10);
        }

        // handle the minus case 
        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        handler.selection.endRowIdx = newEndRowIdx;
        handler.selection.endColIdx = newEndColIdx;

        if(handler.selection.type === "row" || handler.selection.type === "rowRange")
        {
            handler.selection.type = "rowRange"
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        else if(handler.selection.type === "column" || handler.selection.type === "columnRange")
        {
            handler.selection.type = "columnRange"
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        else
        {
            handler.selection.type = (handler.selection.startRowIdx === handler.selection.endRowIdx && handler.selection.startColIdx === handler.selection.endColIdx) ? "cell" : "range";
            adjustViewportToCell(newEndRowIdx, newEndColIdx, this.renderer, this.workbook, this.viewport);
        }
        (handler as any).updateView();
    }

    // jump to end to data boundry via ctrl + -> 
    private jumpToDataBoundary(rowDelta: number, colDelta: number, handler: InteractionHandler): void 
    {
        if (!handler.selection || handler.selection.startRowIdx === undefined || handler.selection.startColIdx === undefined) 
            return;

        let currentR = handler.selection.startRowIdx;
        let currentC = handler.selection.startColIdx;

        const checkCellFilled = (rIdx: number, cIdx: number): boolean => 
        {
            const row = this.workbook.rows[rIdx];

            const col = this.workbook.columns[cIdx];

            if (!row || !col) 
                return false;

            const cell = this.workbook.getCell(row.id, col.name);

            return Boolean(cell && cell.text.trim().length > 0);
        };

        let firstNextR = currentR + rowDelta;
        let firstNextC = currentC + colDelta;

        // if it goes to out of boundry return it
        if (firstNextR < 0 || firstNextR >= this.workbook.rows.length || firstNextC < 0 || firstNextC >= this.workbook.columns.length)
            return;

        const isCurrentFilled = checkCellFilled(currentR, currentC);
        const isNextFilled = checkCellFilled(firstNextR, firstNextC);
        let lookForFilled: boolean;
        
        if (isCurrentFilled && !isNextFilled) 
        {
            // if current is filled and next is not filled
            currentR = firstNextR;
            currentC = firstNextC;

            // cuurent is filled and next is not so we need to continue to find end bound
            lookForFilled = true; 
        } 
        else if (isCurrentFilled && isNextFilled) 
        {
            //  if current and next both are filled

            // next is also filled so need to find end bound
            lookForFilled = false; 
        } 
        else 
        {
            // if current is not filled

            // look for end bound
            lookForFilled = true; 
        }

        while (true) 
        {
            let nextR = currentR + rowDelta;
            let nextC = currentC + colDelta;

            // check until the current limits of workbook
            if (nextR < 0 || nextR >= this.workbook.rows.length || nextC < 0 || nextC >= this.workbook.columns.length) 
                break;

            const nextFilled = checkCellFilled(nextR, nextC);

            if (lookForFilled) 
            {
                if (nextFilled) 
                {
                    currentR = nextR;
                    currentC = nextC;
                    break;
                }
            } 
            else 
            {
                if (!nextFilled) 
                {
                    break;
                }
            }

            currentR = nextR;
            currentC = nextC;

            if (rowDelta !== 0 && (currentR === 0 || currentR === this.workbook.rows.length - 1)) break;
            if (colDelta !== 0 && (currentC === 0 || currentC === this.workbook.columns.length - 1)) break;
        }

        // apply selection to last filled or last cell in row or column
        const targetRow = this.workbook.rows[currentR];
        const targetCol = this.workbook.columns[currentC];

        if (targetRow && targetCol) 
        {
            handler.selection = {
                type: "cell",
                rowId: targetRow.id,
                colName: targetCol.name,
                startRowIdx: currentR,
                startColIdx: currentC,
                endRowIdx: currentR,
                endColIdx: currentC
            };
            adjustViewportToCell(currentR, currentC, this.renderer, this.workbook, this.viewport);
            (handler as any).updateView();
        }
    }
}