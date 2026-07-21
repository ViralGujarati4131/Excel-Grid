import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "../rendering/Viewport.js";
import { CellEditor } from "../components/CellEditor.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
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
import { InputKeyboardHandler } from "./InputKeyboardHandler.js";
import { RowResize } from "../functionality/RowResize.js";
import { ColumnResize } from "../functionality/ColumnResize.js";
import type { ColumnHoverResizeInfo, ColumnResizeState, RowHoverResizeInfo, RowResizeState, SelectionState } from "../utils/States.js";

export class InteractionHandler 
{
    public selection: SelectionState | null = null;
    
    public dragSelectionType: "cell" | "row" | "column" = "cell";

    private rowHoverResizeInfo: RowHoverResizeInfo | null = null;
    private rowResizeState: RowResizeState | null = null;

    private columnResizeState: ColumnResizeState | null = null;
    private columnHoverResizeInfo: ColumnHoverResizeInfo | null = null;
    
    // dom element
    private domFileInput = document.getElementById("jsonFileInput") as HTMLInputElement | null;
    private domSpinner = document.getElementById("loadingSpinner");

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
    private rowResize: RowResize;
    private columnResize: ColumnResize;
    
    // event handlers
    private fileInputHandler: FileInputHandler;
    private keyboardHandler: GridKeyboardHandler;
    private mouseHandler: GridMouseHandler;
    private windowHandler: GridWindowHandler;
    private inputKeyboardHandler: InputKeyboardHandler;

    constructor(
        public workbook: Workbook,
        private viewport: Viewport,
        private renderer: CanvasRenderer,
        private editor: CellEditor
    ) 
    {
        // event functionality initialize
        this.cellEditing = new CellEditing(viewport, workbook, renderer, editor, this.history);
        this.cellMove = new CellMove(viewport, workbook, renderer);
        this.cellRangeSelection = new CellRangeSelection(viewport, workbook, renderer, editor);
        this.reachtoDataBoundary = new ReachDataBoundry(viewport, workbook, renderer);
        this.canvasUndoRedo = new CanvasUndoRedo(viewport, workbook, renderer, this.history);
        this.canvasScroll = new CanvasScroll(viewport, workbook, renderer);
        this.fileUpload = new FileUpload(workbook, viewport, this.domSpinner);
        this.rowResize = new RowResize(workbook, this.history, editor);
        this.columnResize = new ColumnResize(workbook, this.history, editor);

        // event handlers initialize
        this.fileInputHandler = new FileInputHandler(this.fileUpload);
        
        this.inputKeyboardHandler = new InputKeyboardHandler(this.editor, this.cellMove);

        this.keyboardHandler = new GridKeyboardHandler(
            this.cellEditing, this.cellMove, this.cellRangeSelection, this.reachtoDataBoundary, this.canvasUndoRedo, this.editor
        );

        this.mouseHandler = new GridMouseHandler(
            this.workbook, this.viewport, this.renderer, this.editor, this.cellEditing, this.cellRangeSelection, this.rowResize, this.columnResize
        );
        
        this.windowHandler = new GridWindowHandler(
            this.canvasScroll, this.renderer
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
            this.domFileInput.addEventListener("change", (e) => this.fileInputHandler.handleFileImport(e, this));
        }
        
        window.addEventListener("keydown", (e) => this.keyboardHandler.handleGlobalKeyDown(e, this));

        canvas.addEventListener("pointerdown", (e) => this.mouseHandler.handlePointerDown(e, this));
        canvas.addEventListener("pointermove", (e) => this.mouseHandler.handlePointerMove(e, this));
        canvas.addEventListener("pointerup", (e) => this.mouseHandler.handlePointerUp(e, this));
        canvas.addEventListener("dblclick", (e) => this.mouseHandler.handleDoubleClick(e, this));
        
        window.addEventListener("resize", () => this.windowHandler.handleResize(this));
        canvas.addEventListener("wheel", (e) => this.windowHandler.handleScroll(e, this), { passive: false });
        
        this.editor.getElement().addEventListener("blur", () => this.cellEditing.saveEditorContent(this));
        this.editor.getElement().addEventListener("keydown", (e) => this.inputKeyboardHandler.handleKeyDown(e, this));
    }

    // update view after change in view
    public updateView(): void 
    {
        // if multiple entire row or column selected than if expantion happen to maintain that
        // row and column selected
        if (this.selection) 
        {
            if (this.dragSelectionType === "column") 
            {
                this.selection.startRowIdx = 0;
                this.selection.endRowIdx = this.workbook.rows.length - 1;
            } 
            else if (this.dragSelectionType === "row") 
            {
                this.selection.startColIdx = 0;
                this.selection.endColIdx = this.workbook.columns.length - 1;
            }
        }
        updateRibbonMetrics(this.selection, this.workbook);
        this.renderer.render(this.workbook, this.viewport, this.selection);
    }
}