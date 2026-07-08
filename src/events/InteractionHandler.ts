import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";
import { RowColumnResizeManage } from "../utils/RowColumnResizeManage.js";
import { updateRibbonMetrics } from "../utils/UpdateRibbonMetrices.js";
import { JsonUploadHandler } from "./JsonUploadHandler.js";
import { GridKeyboardHandler } from "./GridKeyboardHandler.js";
import { GridMouseHandler } from "./GridMouseHandler.js";
import { GridWindowHandler } from "./GridWindowHandler.js";

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
    public selection: SelectionState | null = null;
    private resizeState: ResizeState | null = null;
    private hoverResizeInfo: { type: "row" | "column"; index: number } | null = null;
    private isSelectingRange = false;
    private dragSelectionType: "cell" | "row" | "column" = "cell";

    private history = new CommandHistory();
    private resizeManager = new RowColumnResizeManage();
    
    private jsonUploadHandler!: JsonUploadHandler;
    private keyboardHandler!: GridKeyboardHandler;
    private mouseHandler!: GridMouseHandler;
    private windowHandler!: GridWindowHandler;

    private domFileInput = document.getElementById("jsonFileInput") as HTMLInputElement | null;
    private domSpinner = document.getElementById("loadingSpinner");

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ) 
    {
        this.jsonUploadHandler = new JsonUploadHandler(
            this.workbook, this.viewport, this.domSpinner, () => this.updateView()
        );
        this.keyboardHandler = new GridKeyboardHandler(
            this.workbook, this.viewport, this.renderer, this.editor, this.history
        );
        this.mouseHandler = new GridMouseHandler(
            this.workbook, this.viewport, this.renderer, this.editor, this.history, this.resizeManager,
            () => this.updateView()
        );
        this.windowHandler = new GridWindowHandler(
            this.workbook, this.viewport, this.renderer, () => this.updateView()
        );
        this.bindEvents();
    }

    // this will bind all the events in canvas
    private bindEvents(): void 
    {
        const canvas = this.renderer.getCanvasElement();

        window.addEventListener("resize", () => this.windowHandler.handleResize());

        canvas.addEventListener("mousedown", (e) => this.mouseHandler.handleMouseDown(e, this));
        canvas.addEventListener("mousemove", (e) => this.mouseHandler.handleMouseMove(e, this));
        canvas.addEventListener("mouseup", () => this.mouseHandler.handleMouseUp(this));
        canvas.addEventListener("dblclick", (e) => this.mouseHandler.handleDoubleClick(e, this.selection));
        
        window.addEventListener("keydown", (e) => this.keyboardHandler.handleGlobalKeyDown(e, this));
        
        this.editor.getElement().addEventListener("blur", () => this.saveEditorContent());

        this.editor.getElement().addEventListener("keydown", (e) => 
        {
            if (e.key === "Enter") 
            {
                e.stopPropagation(); 
                this.editor.getElement().blur();
                (this.keyboardHandler as any).moveSelection(1, 0, this);
                e.preventDefault();
            }
        });

        canvas.addEventListener("wheel", (e) => this.windowHandler.handleScroll(e), { passive: false });

        if (this.domFileInput) 
        {
            this.domFileInput.addEventListener("change", (e) => this.jsonUploadHandler.handleCustomJsonUpload(e));
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
                    const cmd = new WriteTextCommand(cell, newText, oldText, this.selection.startRowIdx, this.selection.startColIdx);
                    cmd.execute();
                    this.history.add(cmd);
                }
            }
        }
        this.editor.hide();
        this.updateView();
    }

    // update view after change in view
    private updateView(): void 
    {
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

        updateRibbonMetrics(this.selection, this.workbook);
        this.renderer.render(this.workbook, this.viewport, this.selection);
    }
}