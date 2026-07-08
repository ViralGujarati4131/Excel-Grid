import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";
import { ResizeColumnCommand } from "../undoRedo/commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "../undoRedo/commands/ResizeRowCommand.js";
import { RowColumnResizeManage } from "../utils/RowColumnResizeManage.js";
import { getCellByCoordination } from "../utils/GetCellByCoordination.js";
import { adjustViewportToCell } from "../utils/AdjustViewportToCell.js";
import { updateRibbonMetrics } from "../utils/UpdateRibbonMetrices.js";
// import { moveSelection } from "../utils/MoveSelection.js";

export interface SelectionState 
{
    type: "cell" | "row" | "column" | "range";
    rowId: number | null;
    colName: string | null;
    startRowIdx?: number;
    startColIdx?: number;
    endRowIdx?: number;
    endColIdx?: number;
}

interface ResizeState 
{
    type: "row" | "column";
    index: number;
    startPos: number;
    startSize: number;
}

export class InteractionHandler 
{
    private selection: SelectionState | null = null;
    private resizeState: ResizeState | null = null;
    private hoverResizeInfo: { type: "row" | "column"; index: number } | null = null;
    private isSelectingRange = false;
    private dragSelectionType: "cell" | "row" | "column" = "cell";

    private history = new CommandHistory();
    private resizeManager = new RowColumnResizeManage();

    private domFileInput = document.getElementById("jsonFileInput") as HTMLInputElement | null;
    private domSpinner = document.getElementById("loadingSpinner");

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ) 
    {
        this.bindEvents();
    }

    // this will bind all the events in canvas
    private bindEvents(): void 
    {
        const canvas = this.renderer.getCanvasElement();

        window.addEventListener("resize", () => 
        {
            this.renderer.resize(window.innerWidth, window.innerHeight - 40);
            this.updateView();
        });

        canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("mouseup", () => this.handleMouseUp());
        canvas.addEventListener("dblclick", (e) => this.handleDoubleClick(e));
        window.addEventListener("keydown", (e) => this.handleGlobalKeyDown(e));
        this.editor.getElement().addEventListener("blur", () => this.saveEditorContent());

        this.editor.getElement().addEventListener("keydown", (e) => 
        {
            if (e.key === "Enter") 
            {
                e.stopPropagation(); 
                this.editor.getElement().blur();
                this.moveSelection(1,0)
                // moveSelection(1, 0,this.workbook,this.selection,this.viewport,this.renderer,this.dragSelectionType); 
                e.preventDefault();
            }
        });

        canvas.addEventListener("wheel", (e) => this.handleScroll(e), { passive: false });

        if (this.domFileInput) 
        {
            this.domFileInput.addEventListener("change", (e) => this.handleCustomJsonUpload(e));
        }
    }

    // mouse down mean when we just press the mouse
    private handleMouseDown(e: MouseEvent): void 
    {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // check if mouse down is for resizing 
        if (this.hoverResizeInfo) 
        {
            
            // column resize
            if (this.hoverResizeInfo.type === "column") 
            {
                const col = this.workbook.columns[this.hoverResizeInfo.index];
                if (col) 
                {
                    this.resizeState = {
                        type: "column",
                        index: this.hoverResizeInfo.index,
                        startPos: e.clientX,
                        startSize: col.width
                    };
                }
            } 
            else 
            {
                // row resize
                const row = this.workbook.rows[this.hoverResizeInfo.index];
                if (row) 
                {
                    this.resizeState = {
                        type: "row",
                        index: this.hoverResizeInfo.index,
                        startPos: e.clientY,
                        startSize: row.height
                    };
                }
            }
            this.editor.hide();
            return;
        }

        // if mouse is at left top side than clear selection
        if (x < this.viewport.headerWidth && y < this.viewport.headerHeight) 
        {
            this.selection = null;
            this.editor.hide();
            this.updateView();
            return;
        }

        // get index or row column for check where mouse is down
        const indices = getCellByCoordination(x, y,this.viewport,this.workbook);
        if (!indices) 
            return;

        this.editor.getElement().blur();
        this.isSelectingRange = true;

        // is mouse is down for entire cloumn select
        if (y < this.viewport.headerHeight) 
        {
            if (indices.colIdx !== -1) 
            {
                const col = this.workbook.columns[indices.colIdx];
                if (col) 
                {
                    this.dragSelectionType = "column";
                    this.selection = {
                        type: "column",
                        rowId: null,
                        colName: col.name,
                        startColIdx: indices.colIdx,
                        endColIdx: indices.colIdx,
                        startRowIdx: 0,
                        endRowIdx: this.workbook.rows.length - 1
                    };
                }
            }
            this.updateView();
            return;
        }

        // is mouse is down for entire row select
        if (x < this.viewport.headerWidth) 
        {
            if (indices.rowIdx !== -1) 
            {
                const row = this.workbook.rows[indices.rowIdx];
                if (row) 
                {
                    this.dragSelectionType = "row";
                    this.selection = {
                        type: "row",
                        rowId: row.id,
                        colName: null,
                        startRowIdx: indices.rowIdx,
                        endRowIdx: indices.rowIdx,
                        startColIdx: 0,
                        endColIdx: this.workbook.columns.length - 1
                    };
                }
            }
            this.updateView();
            return;
        }

        // is mouse is down for the cell select
        if (indices.rowIdx !== -1 && indices.colIdx !== -1) 
        {
            const row = this.workbook.rows[indices.rowIdx];
            const col = this.workbook.columns[indices.colIdx];
            if (row && col) 
            {
                this.dragSelectionType = "cell";
                this.selection = {
                    type: "cell",
                    rowId: row.id,
                    colName: col.name,
                    startRowIdx: indices.rowIdx,
                    startColIdx: indices.colIdx,
                    endRowIdx: indices.rowIdx,
                    endColIdx: indices.colIdx
                };
            }
            this.updateView();
        }
    }

    // this is for show resize icon for row, column and
    private handleMouseMove(e: MouseEvent): void 
    {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // move mouse for resize the size of column or row
        if (this.resizeState) 
        {
            if (this.resizeState.type === "column") 
            {        
                const deltaX = e.clientX - this.resizeState.startPos;
                const col = this.workbook.columns[this.resizeState.index];

                if (col) 
                    col.width = Math.max(30, this.resizeState.startSize + deltaX);
            } 
            else 
            {
                const deltaY = e.clientY - this.resizeState.startPos;
                const row = this.workbook.rows[this.resizeState.index];

                if (row) 
                    row.height = Math.max(15, this.resizeState.startSize + deltaY);
            }
            this.updateView();
            return;
        }

        // move mouse for multi cell selection
        if (this.isSelectingRange && this.selection) 
        {
            const indices = getCellByCoordination(x, y,this.viewport,this.workbook);
            
            if (indices) 
            {
                if (this.dragSelectionType === "column" && indices.colIdx !== -1) 
                {
                    // when you select mutliple columns or single column while moving
                    this.selection.endColIdx = indices.colIdx;
                    this.selection.type = (this.selection.startColIdx === this.selection.endColIdx) ? "column" : "range";
                } 
                else if (this.dragSelectionType === "row" && indices.rowIdx !== -1) 
                {
                    // when you select multiple rows or single row while moving
                    this.selection.endRowIdx = indices.rowIdx;
                    this.selection.type = (this.selection.startRowIdx === this.selection.endRowIdx) ? "row" : "range";
                } 
                else if (this.dragSelectionType === "cell" && indices.rowIdx !== -1 && indices.colIdx !== -1) 
                {
                    // when you select multiple cells or single cell while moving
                    this.selection.endRowIdx = indices.rowIdx;
                    this.selection.endColIdx = indices.colIdx;
                    this.selection.type = (this.selection.startRowIdx === this.selection.endRowIdx && this.selection.startColIdx === this.selection.endColIdx) ? "cell" : "range";
                }
                this.updateView();
            }
            return;
        }

        // change cursor type if near to row or column header edge for resize other wise default
        this.hoverResizeInfo = this.resizeManager.checkHoverEdge(
            x, y, this.workbook, this.viewport, this.renderer, this.renderer.getCanvasElement()
        );
    }

    
    private handleMouseUp(): void 
    {   
        
        // if row column resized happen than store that value command and put it to history undo array
        if (this.resizeState) 
        {
            // column resize
            if (this.resizeState.type === "column") 
            {
                const col = this.workbook.columns[this.resizeState.index];

                if (col && col.width !== this.resizeState.startSize) 
                {
                    const cmd = new ResizeColumnCommand(col, col.width, this.resizeState.startSize);
                    this.history.add(cmd);
                }
            } 
            else 
            {
                // row resize
                const row = this.workbook.rows[this.resizeState.index];

                if (row && row.height !== this.resizeState.startSize) 
                {
                    const cmd = new ResizeRowCommand(row, row.height, this.resizeState.startSize);
                    this.history.add(cmd);
                }
            }
        }

        // clear the resize state resize complete and mouse up
        this.resizeState = null;

        // clear the isSelectingRange variable after complete selection and mouse up
        this.isSelectingRange = false;
    }

    // this is to handle double click event
    private handleDoubleClick(e: MouseEvent): void 
    {

        // if nothing is selection and double click or if row or cloumn select and double click than return
        if (!this.selection || this.selection.type !== "cell") 
            return;
        
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < this.viewport.headerWidth || y < this.viewport.headerHeight) return;

        // get row and column
        
        const colIndex = this.workbook.columns.findIndex(c => c.name === this.selection!.colName);
        const rowIndex = this.workbook.rows.findIndex(r => r.id === this.selection!.rowId);
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
            }
        }
    }

    private handleGlobalKeyDown(e: KeyboardEvent): void 
    {

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
                        this.selection = {
                            type: "cell",
                            rowId: row.id,
                            colName: col.name,
                            startRowIdx: lastCommand.rowIdx,
                            startColIdx: lastCommand.colIdx,
                            endRowIdx: lastCommand.rowIdx,
                            endColIdx: lastCommand.colIdx
                        };
                        adjustViewportToCell(lastCommand.rowIdx, lastCommand.colIdx,this.renderer,this.workbook,this.viewport);
                    }
                }

                // update view after the undo
                this.updateView();
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
                        this.selection = {
                            type: "cell",
                            rowId: row.id,
                            colName: col.name,
                            startRowIdx: nextCommand.rowIdx,
                            startColIdx: nextCommand.colIdx,
                            endRowIdx: nextCommand.rowIdx,
                            endColIdx: nextCommand.colIdx
                        };
                        adjustViewportToCell(nextCommand.rowIdx, nextCommand.colIdx,this.renderer,this.workbook,this.viewport);
                    }
                }

                // to update the view after redo
                this.updateView();
            }
            e.preventDefault();
            return;
        }

        if (this.editor.getElement().style.display !== "none") 
            return;

        if (this.selection && (e.key.startsWith("Arrow") || e.key === "Enter")) 
        {
            let rowDelta = 0;
            let colDelta = 0;
            let isArrowKey = e.key.startsWith("Arrow");

            switch (e.key) 
            {
                case "ArrowUp":    rowDelta = -1; break;
                case "ArrowDown":  rowDelta = 1;  break;
                case "ArrowLeft":  colDelta = -1; break;
                case "ArrowRight": colDelta = 1;  break;
                case "Enter":      rowDelta = 1;  break;
            }

            if (rowDelta !== 0 || colDelta !== 0) 
            {
                if (isArrowKey && e.shiftKey) 
                {
                    // Shift + Arrow Keys -> Expand Range Selection Box
                    this.rangeSelectionUsingKey(rowDelta, colDelta);
                }
                else if (isArrowKey && (e.ctrlKey)) 
                {
                    // Ctrl + Arrow Keys -> Fast Jump to Data Boundary 
                    this.jumpToDataBoundary(rowDelta, colDelta);
                } 
                else 
                {
                    // Single Arrow cell step movement
                    this.moveSelection(rowDelta,colDelta);
                    // moveSelection(rowDelta, colDelta,this.workbook,this.selection,this.viewport,this.renderer,this.dragSelectionType);
                }
                e.preventDefault();
                return;
            }
        }

       // render the inputBox on cell
        if (this.selection && this.selection.type === "cell" && e.key.length === 1) 
        {
            const colIndex = this.workbook.columns.findIndex(c => c.name === this.selection!.colName);
            const rowIndex = this.workbook.rows.findIndex(r => r.id === this.selection!.rowId);
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

    // this is use to save the input value
    private saveEditorContent(): void 
    {
        
        if (this.selection && this.selection.type === "cell" && this.selection.rowId && this.selection.colName && this.selection.startRowIdx !== undefined && this.selection.startColIdx !== undefined) 
        {
            const cell = this.workbook.getCell(this.selection.rowId, this.selection.colName);
            if (cell) 
            {
                const oldText = cell.text;
                const newText = this.editor.getValue();
                
                // store the written text as a command for maintain undo redo state
                if (oldText !== newText) 
                {
                    const cmd = new WriteTextCommand(
                        cell, 
                        newText, 
                        oldText, 
                        this.selection.startRowIdx, 
                        this.selection.startColIdx
                    );
                    cmd.execute();
                    this.history.add(cmd);
                }
            }
        }

        this.editor.hide();
        this.updateView();
    }

    private handleScroll(e: WheelEvent): void 
    {
        this.viewport.scrollX += e.deltaX;
        this.viewport.scrollY += e.deltaY;

        let currentWorkbookWidth = 0;
        for (const col of this.workbook.columns) 
            currentWorkbookWidth += col.width;
        
        let currentWorkbookHeight = 0;
        for (const row of this.workbook.rows) 
            currentWorkbookHeight += row.height;

        const canvasElement = this.renderer.getCanvasElement();
        const triggerThresholdPixels = 300;

        // add the row dynamically when near to reach at end of the scroll
        if ((this.viewport.scrollY + canvasElement.height) > (currentWorkbookHeight - triggerThresholdPixels)) 
        {
            this.workbook.expandRows(100);
            currentWorkbookHeight = 0;

            for (const row of this.workbook.rows) 
                currentWorkbookHeight += row.height;
        }

        // add the column dynamically when near to reach at end of the scroll
        if ((this.viewport.scrollX + canvasElement.width) > (currentWorkbookWidth - triggerThresholdPixels)) 
        {
            this.workbook.expandColumns(30);
            currentWorkbookWidth = 0;

            for (const col of this.workbook.columns) 
                currentWorkbookWidth += col.width;
        }

        this.viewport.clamp(currentWorkbookWidth, currentWorkbookHeight, canvasElement.width, canvasElement.height);
        this.updateView();
        e.preventDefault();
    }

    // read the data of json file and store it in cells and update view 
    private handleCustomJsonUpload(e: Event): void 
    {
        const target = e.target as HTMLInputElement;
        const file = target.files ? target.files[0] : null;

        if (!file) 
            return;

        if (this.domSpinner) 
            this.domSpinner.style.display = "inline";

        const reader = new FileReader();

        reader.readAsText(file);

        reader.onload = (event) => 
        {
            try {
                const rawText = event.target?.result as string;
                const parsedData = JSON.parse(rawText);

                const headerName: string[] = [];    
                headerName.push("id")
                for(const header in parsedData[0])
                {
                    headerName.push(header)
                }                
                
                const finalRecordSet: unknown[] = Array.isArray(parsedData) ? parsedData : [parsedData];                

                // add data into the cell 
                this.workbook.loadJsonRecordSet(finalRecordSet,headerName);
                
                this.viewport.scrollX = 0;
                this.viewport.scrollY = 0;
                
            } 
            catch (error) 
            {
                alert("Invalid JSON File Formats. Please verify inner file arrays nodes keys structures layout.");
                console.error(error);
            } 
            finally 
            {
                if (this.domSpinner) 
                    this.domSpinner.style.display = "none";

                target.value = ""; 
                this.updateView();
            }
        };
    }





    // selection set if selection change via  -> 
    private moveSelection(rowDelta: number, colDelta: number): void 
    {
        // if nothing is selection return
        if (!this.selection || this.selection.startRowIdx === undefined || this.selection.startColIdx === undefined) 
            return;
        
        // set new row column id
        let newRowIdx = this.selection.startRowIdx + rowDelta;
        let newColIdx = this.selection.startColIdx + colDelta;

        // after move if it come near to end at scroll expand row
        if (newRowIdx >= this.workbook.rows.length - 5) 
        {
            this.workbook.expandRows(50);
        }
        
        // after move if it come near to end at scroll expand column
        if (newColIdx >= this.workbook.columns.length - 3) 
        {
            this.workbook.expandColumns(10);
        }

        // to handle minus index condition
        newRowIdx = Math.max(0, Math.min(newRowIdx, this.workbook.rows.length - 1));
        newColIdx = Math.max(0, Math.min(newColIdx, this.workbook.columns.length - 1));

        // new row col of cell
        const row = this.workbook.rows[newRowIdx];
        const col = this.workbook.columns[newColIdx];

        if (row && col) 
        {
            this.selection = {
                type: "cell",
                rowId: row.id,
                colName: col.name,
                startRowIdx: newRowIdx,
                startColIdx: newColIdx,
                endRowIdx: newRowIdx,
                endColIdx: newColIdx
            };

            // make view port visible if cell selection go out of visible boundry
            adjustViewportToCell(newRowIdx, newColIdx,this.renderer,this.workbook,this.viewport);
            this.updateView();
        }
    }

    // multi cell select via shift + -> 
    private rangeSelectionUsingKey(rowDelta: number, colDelta: number): void 
    {
        if (!this.selection || this.selection.startRowIdx === undefined || this.selection.startColIdx === undefined || this.selection.endRowIdx === undefined || this.selection.endColIdx === undefined) 
            return;

        let newEndRowIdx = this.selection.endRowIdx + rowDelta;
        let newEndColIdx = this.selection.endColIdx + colDelta;

        // if near to end row or column expand row and column
        if (newEndRowIdx >= this.workbook.rows.length - 5) 
            this.workbook.expandRows(50);

        if (newEndColIdx >= this.workbook.columns.length - 3) 
            this.workbook.expandColumns(10);

        // handle the minus case 
        newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, this.workbook.rows.length - 1));
        newEndColIdx = Math.max(0, Math.min(newEndColIdx, this.workbook.columns.length - 1));

        this.selection.endRowIdx = newEndRowIdx;
        this.selection.endColIdx = newEndColIdx;

        if (this.selection.startRowIdx === this.selection.endRowIdx && this.selection.startColIdx === this.selection.endColIdx) 
        {
            this.selection.type = "cell";
        } 
        else 
        {
            this.selection.type = "range";  
        }

        adjustViewportToCell(newEndRowIdx, newEndColIdx,this.renderer,this.workbook,this.viewport);
        this.updateView();
    }

    // jump to end to data boundry via ctrl + -> 
    private jumpToDataBoundary(rowDelta: number, colDelta: number): void 
    {
        if (!this.selection || this.selection.startRowIdx === undefined || this.selection.startColIdx === undefined) 
            return;

        let currentR = this.selection.startRowIdx;
        let currentC = this.selection.startColIdx;

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

            if (rowDelta !== 0 && (currentR === 0 || currentR === this.workbook.rows.length - 1)) 
                break;
            
            if (colDelta !== 0 && (currentC === 0 || currentC === this.workbook.columns.length - 1)) 
                break;
        }

        // apply selection to next filled or last cell in row or column
        const targetRow = this.workbook.rows[currentR];
        const targetCol = this.workbook.columns[currentC];

        if (targetRow && targetCol) 
        {
            this.selection = {
                type: "cell",
                rowId: targetRow.id,
                colName: targetCol.name,
                startRowIdx: currentR,
                startColIdx: currentC,
                endRowIdx: currentR,
                endColIdx: currentC
            };
            adjustViewportToCell(currentR, currentC,this.renderer,this.workbook,this.viewport);
            this.updateView();
        }
    }






    // update view after change in view
    private updateView(): void {

        // if multiple entire row or column selected than if expantion happen to maintain that
        // row and column selected
        if (this.selection) 
        {
            if (this.selection.type === "column" || (this.selection.type === "range" && this.dragSelectionType === "column")) 
            {
                this.selection.endRowIdx = this.workbook.rows.length - 1;
            } 
            else if (this.selection.type === "row" || (this.selection.type === "range" && this.dragSelectionType === "row")) 
            {
                this.selection.endColIdx = this.workbook.columns.length - 1;
            }   
        }

        updateRibbonMetrics(this.selection,this.workbook);

        this.renderer.render(this.workbook, this.viewport, this.selection);
    }
}   