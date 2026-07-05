import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CellEditor } from "../components/CellEditor.js";

export interface SelectionState {
    type: "cell" | "row" | "column" | "range";
    rowId: number | null;
    colName: string | null;
    startRowIdx?: number;
    startColIdx?: number;
    endRowIdx?: number;
    endColIdx?: number;
}

interface ResizeState {
    type: "row" | "column";
    index: number;
    startPos: number;
    startSize: number;
}

export class InteractionHandler {
    private selection: SelectionState | null = null;
    private resizeState: ResizeState | null = null;
    private hoverResizeInfo: { type: "row" | "column"; index: number } | null = null;
    private isSelectingRange = false;
    private dragSelectionType: "cell" | "row" | "column" = "cell";

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ) {
        this.bindEvents();
    }

    private bindEvents(): void {
        const canvas = this.renderer.getCanvasElement();

        window.addEventListener("resize", () => {
            this.renderer.resize(window.innerWidth, window.innerHeight);
            this.updateView();
        });

        canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("mouseup", () => this.handleMouseUp());
        
        canvas.addEventListener("dblclick", (e) => this.handleDoubleClick(e));
        window.addEventListener("keydown", (e) => this.handleGlobalKeyDown(e));
        
        this.editor.getElement().addEventListener("blur", () => this.saveEditorContent());
        this.editor.getElement().addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.stopPropagation(); 
                this.editor.getElement().blur();
                this.moveSelection(1, 0); 
                e.preventDefault();
            }
        });

        canvas.addEventListener("wheel", (e) => this.handleScroll(e), { passive: false });
    }

    private checkHoverEdge(x: number, y: number): void {
        const canvas = this.renderer.getCanvasElement();
        const tolerance = 5;
        this.hoverResizeInfo = null;

        if (y < this.viewport.headerHeight && x > this.viewport.headerWidth) {
            for (let c = 0; c < this.workbook.columns.length; c++) {
                const edgeX = this.viewport.headerWidth + this.renderer.getColX(this.workbook, c + 1) - this.viewport.scrollX;
                if (Math.abs(x - edgeX) <= tolerance) {
                    canvas.style.cursor = "col-resize";
                    this.hoverResizeInfo = { type: "column", index: c };
                    return;
                }
            }
        }

        if (x < this.viewport.headerWidth && y > this.viewport.headerHeight) {
            for (let r = 0; r < this.workbook.rows.length; r++) {
                const edgeY = this.viewport.headerHeight + this.renderer.getRowY(this.workbook, r + 1) - this.viewport.scrollY;
                if (Math.abs(y - edgeY) <= tolerance) {
                    canvas.style.cursor = "row-resize";
                    this.hoverResizeInfo = { type: "row", index: r };
                    return;
                }
            }
        }

        canvas.style.cursor = "default";
    }

    private getGridIndicesFromMouse(x: number, y: number): { rowIdx: number; colIdx: number } | null {
        let runningY = this.viewport.headerHeight;
        let rowIdx = -1;
        for (let r = 0; r < this.workbook.rows.length; r++) {
            const row = this.workbook.rows[r];
            if (!row) continue;
            if (y >= runningY - this.viewport.scrollY && y < runningY + row.height - this.viewport.scrollY) {
                rowIdx = r;
                break;
            }
            runningY += row.height;
        }

        let runningX = this.viewport.headerWidth;
        let colIdx = -1;
        for (let c = 0; c < this.workbook.columns.length; c++) {
            const col = this.workbook.columns[c];
            if (!col) continue;
            if (x >= runningX - this.viewport.scrollX && x < runningX + col.width - this.viewport.scrollX) {
                colIdx = c;
                break;
            }
            runningX += col.width;
        }

        return { rowIdx, colIdx };
    }

    private handleMouseDown(e: MouseEvent): void {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.hoverResizeInfo) {
            if (this.hoverResizeInfo.type === "column") {
                const col = this.workbook.columns[this.hoverResizeInfo.index];
                if (col) {
                    this.resizeState = {
                        type: "column",
                        index: this.hoverResizeInfo.index,
                        startPos: e.clientX,
                        startSize: col.width
                    };
                }
            } else {
                const row = this.workbook.rows[this.hoverResizeInfo.index];
                if (row) {
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

        if (x < this.viewport.headerWidth && y < this.viewport.headerHeight) {
            this.selection = null;
            this.editor.hide();
            this.updateView();
            return;
        }

        const indices = this.getGridIndicesFromMouse(x, y);
        if (!indices) return;

        this.editor.hide();
        this.isSelectingRange = true;

        if (y < this.viewport.headerHeight) {
            if (indices.colIdx !== -1) {
                const col = this.workbook.columns[indices.colIdx];
                if (col) {
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

        if (x < this.viewport.headerWidth) {
            if (indices.rowIdx !== -1) {
                const row = this.workbook.rows[indices.rowIdx];
                if (row) {
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

        if (indices.rowIdx !== -1 && indices.colIdx !== -1) {
            const row = this.workbook.rows[indices.rowIdx];
            const col = this.workbook.columns[indices.colIdx];
            if (row && col) {
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

    private handleMouseMove(e: MouseEvent): void {
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.resizeState) {
            if (this.resizeState.type === "column") {
                const deltaX = e.clientX - this.resizeState.startPos;
                const col = this.workbook.columns[this.resizeState.index];
                if (col) col.width = Math.max(30, this.resizeState.startSize + deltaX);
            } else {
                const deltaY = e.clientY - this.resizeState.startPos;
                const row = this.workbook.rows[this.resizeState.index];
                if (row) row.height = Math.max(15, this.resizeState.startSize + deltaY);
            }
            this.updateView();
            return;
        }

        if (this.isSelectingRange && this.selection) {
            const indices = this.getGridIndicesFromMouse(x, y);
            if (indices) {
                if (this.dragSelectionType === "column" && indices.colIdx !== -1) {
                    this.selection.endColIdx = indices.colIdx;
                    this.selection.type = (this.selection.startColIdx === this.selection.endColIdx) ? "column" : "range";
                } else if (this.dragSelectionType === "row" && indices.rowIdx !== -1) {
                    this.selection.endRowIdx = indices.rowIdx;
                    this.selection.type = (this.selection.startRowIdx === this.selection.endRowIdx) ? "row" : "range";
                } else if (this.dragSelectionType === "cell" && indices.rowIdx !== -1 && indices.colIdx !== -1) {
                    this.selection.endRowIdx = indices.rowIdx;
                    this.selection.endColIdx = indices.colIdx;
                    this.selection.type = (this.selection.startRowIdx === this.selection.endRowIdx && this.selection.startColIdx === this.selection.endColIdx) ? "cell" : "range";
                }
                this.updateView();
            }
            return;
        }

        this.checkHoverEdge(x, y);
    }

    private handleMouseUp(): void {
        this.resizeState = null;
        this.isSelectingRange = false;
    }

    private handleDoubleClick(e: MouseEvent): void {
        if (!this.selection || this.selection.type !== "cell") return;
        
        const rect = this.renderer.getCanvasElement().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < this.viewport.headerWidth || y < this.viewport.headerHeight) return;

        const colIndex = this.workbook.columns.findIndex(c => c.name === this.selection!.colName);
        const rowIndex = this.workbook.rows.findIndex(r => r.id === this.selection!.rowId);
        const row = this.workbook.rows[rowIndex];
        const col = this.workbook.columns[colIndex];

        if (row && col) {
            const cell = this.workbook.getCell(row.id, col.name);
            if (cell) {
                const cellX = rect.left + this.viewport.headerWidth + this.renderer.getColX(this.workbook, colIndex) - this.viewport.scrollX;
                const cellY = rect.top + this.viewport.headerHeight + this.renderer.getRowY(this.workbook, rowIndex) - this.viewport.scrollY;
                this.editor.show(cell, cellX, cellY, col.width, row.height, cell.text ? "append" : "override");
            }
        }
    }

    private handleGlobalKeyDown(e: KeyboardEvent): void {
        if (this.editor.getElement().style.display !== "none") return;

        if (this.selection && (this.selection.type === "cell" || this.selection.type === "range")) {
            let rowDelta = 0;
            let colDelta = 0;
            let targetActionTriggered = false;

            switch (e.key) {
                case "ArrowUp":
                    rowDelta = -1;
                    targetActionTriggered = true;
                    break;
                case "ArrowDown":
                    rowDelta = 1;
                    targetActionTriggered = true;
                    break;
                case "ArrowLeft":
                    colDelta = -1;
                    targetActionTriggered = true;
                    break;
                case "ArrowRight":
                    colDelta = 1;
                    targetActionTriggered = true;
                    break;
                case "Enter":
                    rowDelta = 1; 
                    targetActionTriggered = true;
                    break;
            }

            if (targetActionTriggered) {
                this.moveSelection(rowDelta, colDelta);
                e.preventDefault();
                return;
            }
        }

       
        if (this.selection && this.selection.type === "cell" && e.key.length === 1) {
            const colIndex = this.workbook.columns.findIndex(c => c.name === this.selection!.colName);
            const rowIndex = this.workbook.rows.findIndex(r => r.id === this.selection!.rowId);
            const canvasRect = this.renderer.getCanvasElement().getBoundingClientRect();

            if (colIndex !== -1 && rowIndex !== -1) {
                const row = this.workbook.rows[rowIndex];
                const col = this.workbook.columns[colIndex];
                if (row && col) {
                    const cell = this.workbook.getCell(row.id, col.name);
                    if (cell) {
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

  
    private moveSelection(rowDelta: number, colDelta: number): void {
        if (!this.selection || this.selection.startRowIdx === undefined || this.selection.startColIdx === undefined) return;

      
        let newRowIdx = this.selection.startRowIdx + rowDelta;
        let newColIdx = this.selection.startColIdx + colDelta;

        if (newRowIdx >= this.workbook.rows.length - 5) {
            this.workbook.expandRows(50);
        }
      
        if (newColIdx >= this.workbook.columns.length - 3) {
            this.workbook.expandColumns(10);
        }

        newRowIdx = Math.max(0, Math.min(newRowIdx, this.workbook.rows.length - 1));
        newColIdx = Math.max(0, Math.min(newColIdx, this.workbook.columns.length - 1));

        const row = this.workbook.rows[newRowIdx];
        const col = this.workbook.columns[newColIdx];

        if (row && col) {
            this.selection = {
                type: "cell",
                rowId: row.id,
                colName: col.name,
                startRowIdx: newRowIdx,
                startColIdx: newColIdx,
                endRowIdx: newRowIdx,
                endColIdx: newColIdx
            };

            this.adjustViewportToCell(newRowIdx, newColIdx);
            this.updateView();
        }
    }

    private adjustViewportToCell(rowIdx: number, colIdx: number): void {
        const canvas = this.renderer.getCanvasElement();
        
        const cellLeft = this.renderer.getColX(this.workbook, colIdx);
        const col = this.workbook.columns[colIdx];
        const cellRight = cellLeft + (col ? col.width : 100);

        const cellTop = this.renderer.getRowY(this.workbook, rowIdx);
        const row = this.workbook.rows[rowIdx];
        const cellBottom = cellTop + (row ? row.height : 30);

        const viewWidth = canvas.width - this.viewport.headerWidth;
        const viewHeight = canvas.height - this.viewport.headerHeight;

        if (cellLeft < this.viewport.scrollX) {
            this.viewport.scrollX = cellLeft;
        } else if (cellRight > this.viewport.scrollX + viewWidth) {
            this.viewport.scrollX = cellRight - viewWidth;
        }

        if (cellTop < this.viewport.scrollY) {
            this.viewport.scrollY = cellTop;
        } else if (cellBottom > this.viewport.scrollY + viewHeight) {
            this.viewport.scrollY = cellBottom - viewHeight;
        }

        let totalW = 0;
        for (const c of this.workbook.columns) totalW += c.width;
        let totalH = 0;
        for (const r of this.workbook.rows) totalH += r.height;

        this.viewport.clamp(totalW, totalH, canvas.width, canvas.height);
    }

    private saveEditorContent(): void {
        if (this.selection && this.selection.type === "cell" && this.selection.rowId && this.selection.colName) {
            const cell = this.workbook.getCell(this.selection.rowId, this.selection.colName);
            if (cell) {
                cell.text = this.editor.getValue();
            }
        }
        this.editor.hide();
        this.updateView();
    }

    private handleScroll(e: WheelEvent): void {
        this.viewport.scrollX += e.deltaX;
        this.viewport.scrollY += e.deltaY;

        let currentWorkbookWidth = 0;
        for (const col of this.workbook.columns) currentWorkbookWidth += col.width;
        
        let currentWorkbookHeight = 0;
        for (const row of this.workbook.rows) currentWorkbookHeight += row.height;

        const canvasElement = this.renderer.getCanvasElement();
        const triggerThresholdPixels = 300;

        if ((this.viewport.scrollY + canvasElement.height) > (currentWorkbookHeight - triggerThresholdPixels)) {
            this.workbook.expandRows(100);
            currentWorkbookHeight = 0;
            for (const row of this.workbook.rows) currentWorkbookHeight += row.height;
        }

        if ((this.viewport.scrollX + canvasElement.width) > (currentWorkbookWidth - triggerThresholdPixels)) {
            this.workbook.expandColumns(30);
            currentWorkbookWidth = 0;
            for (const col of this.workbook.columns) currentWorkbookWidth += col.width;
        }

        this.viewport.clamp(currentWorkbookWidth, currentWorkbookHeight, canvasElement.width, canvasElement.height);
        this.updateView();
        e.preventDefault();
    }

    private updateView(): void {
        this.renderer.render(this.workbook, this.viewport, this.selection);
    }
}   