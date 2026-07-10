import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { WriteTextCommand } from "../undoRedo/commands/WriteTextCommand.js";
import { updateRibbonMetrics } from "../utils/UpdateRibbonMetrices.js";
import { FileInputHandler } from "./FileInputHandler.js";
import { GridKeyboardHandler } from "./GridKeyboardHandler.js";
import { GridMouseHandler } from "./GridMouseHandler.js";
import { GridWindowHandler } from "./GridWindowHandler.js";
import { CellMove } from "../functionality/CellMove.js";
import { CanvasScroll } from "../functionality/CanvasScroll.js";
import { CellEditing } from "../functionality/CellEditing.js";
import { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import { ReachDataBoundry } from "../functionality/ReachDataBoundry.js";
import { CanvasUndoRedo } from "../functionality/CanvasUndoRedo.js";
import { FileUpload } from "../functionality/FileUpload.js";
import { RowColumnResizeManager } from "../functionality/RowCoulmnResizeManager.js";

export interface SelectionState 
{
    type: "cell" | "row" | "column" | "range" | "rowRange" | "columnRange";
    rowId: number | null;
    colName: string | null;
    startRowIdx?: number;
    startColIdx?: number;
    endRowIdx?: number;
    endColIdx?: number;
}

export interface ResizeState 
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
    
    // dom element
    private domFileInput = document.getElementById("jsonFileInput") as HTMLInputElement | null;
    private domSpinner = document.getElementById("loadingSpinner");
    private canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;

    // command history
    private history = new CommandHistory();
    
    // event functionality
    private cellEditing: CellEditing;
    private cellMove: CellMove;
    private cellRangeSelection: CellRangeSelection;
    private reachtoDataBoundary: ReachDataBoundry;
    private canvasUndoRedo: CanvasUndoRedo;
    private canvasScroll: CanvasScroll;
    private fileUpload: FileUpload;
    private rowColumnResizeManager: RowColumnResizeManager;
    
    // event handlers
    private fileInputHandler: FileInputHandler;
    private keyboardHandler: GridKeyboardHandler;
    private mouseHandler: GridMouseHandler;
    private windowHandler: GridWindowHandler;

    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ) 
    {
        // event functionality initialize
        this.cellEditing = new CellEditing(viewport,workbook,renderer,editor);
        this.cellMove = new CellMove(viewport,workbook,renderer);
        this.cellRangeSelection = new CellRangeSelection(viewport,workbook,renderer);
        this.reachtoDataBoundary = new ReachDataBoundry(viewport,workbook,renderer);
        this.canvasUndoRedo = new CanvasUndoRedo(viewport,workbook,renderer,this.history);
        this.canvasScroll = new CanvasScroll(viewport,workbook,renderer,this.updateView);
        this.fileUpload = new FileUpload(workbook,viewport,this.domSpinner,this.updateView);
        this.rowColumnResizeManager = new RowColumnResizeManager(workbook,viewport,renderer,this.canvas,this.history);


        // event handlers initialize
        this.fileInputHandler = new FileInputHandler(this.fileUpload);

        this.keyboardHandler = new GridKeyboardHandler(
            this.cellEditing, this.cellMove, this.cellRangeSelection, this.reachtoDataBoundary,this.canvasUndoRedo, this.editor
        );

        this.mouseHandler = new GridMouseHandler(
            this.workbook, this.viewport, this.renderer, this.editor, this.history, this.rowColumnResizeManager,this.cellEditing,
            () => this.updateView()
        );
        
        this.windowHandler = new GridWindowHandler(
            this.canvasScroll, this.renderer, () => this.updateView()
        );

        // bind all events to the handler
        this.bindEvents();
    }

    // this will bind all the events in canvas
    private bindEvents(): void 
    {
        const canvas = this.renderer.getCanvasElement();
        
        if(this.domFileInput) 
        {
            this.domFileInput.addEventListener("change", (e) => this.fileInputHandler.handleFileImport(e,this));
        }
        
        this.editor.getElement().addEventListener("keydown", (e) => 
        {
            if (e.key === "Enter") 
            {
                e.stopPropagation(); 
                this.editor.getElement().blur();
                this.cellMove.moveSelection(1, 0, this);
                e.preventDefault();
            }
        });
        window.addEventListener("keydown", (e) => this.keyboardHandler.handleGlobalKeyDown(e, this));

        canvas.addEventListener("mousedown", (e) => this.mouseHandler.handleMouseDown(e, this));
        canvas.addEventListener("mousemove", (e) => this.mouseHandler.handleMouseMove(e, this));
        canvas.addEventListener("mouseup", (e) => this.mouseHandler.handleMouseUp(e,this));
        canvas.addEventListener("dblclick", (e) => this.mouseHandler.handleDoubleClick(e, this));
        
        window.addEventListener("resize", () => this.windowHandler.handleResize());
        canvas.addEventListener("wheel", (e) => this.windowHandler.handleScroll(e,this), { passive: false });
        
        this.editor.getElement().addEventListener("blur", () => this.saveEditorContent());
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
            if (this.selection.type === "column" || (this.selection.type === "columnRange" && this.dragSelectionType === "column")) 
            {
                this.selection.endRowIdx = this.workbook.rows.length - 1;
            } 
            else if (this.selection.type === "row" || (this.selection.type === "rowRange" && this.dragSelectionType === "row")) 
            {
                this.selection.endColIdx = this.workbook.columns.length - 1;
            }   
        }
        updateRibbonMetrics(this.selection, this.workbook);
        this.renderer.render(this.workbook, this.viewport, this.selection);
    }
}