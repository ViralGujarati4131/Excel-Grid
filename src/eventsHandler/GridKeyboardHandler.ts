import { CellEditor } from "../components/CellEditor.js";
import { InteractionHandler } from "./InteractionHandler.js";
import { CellEditing } from "../functionality/CellEditing.js";
import { CellMove } from "../functionality/CellMove.js";
import { CellRangeSelection } from "../functionality/CellRangeSelection.js";
import { ReachDataBoundry } from "../functionality/ReachDataBoundry.js";
import { CanvasUndoRedo } from "../functionality/CanvasUndoRedo.js";
import { getMovementDelta } from "../utils/GetAerrowKey.js";

export class GridKeyboardHandler {

    constructor(
        private cellEditing: CellEditing,
        private cellMove: CellMove,
        private cellRangeSelection: CellRangeSelection,
        private reachtoDataBoundary: ReachDataBoundry,
        private canvasUndoRedo: CanvasUndoRedo,
        private editor: CellEditor
    ) {}

    public handleGlobalKeyDown(e: KeyboardEvent, handler: InteractionHandler): void 
    {
        // to edit the existing text and to edit new cell
        if(e.key === "F2")
        {
            this.cellEditing.ActiveCell(handler, e);
        }

        // to cancel the writing in cell and to cancel the editing      
        if (this.editor.getElement().style.display !== "none")
        {  
            if(e.key === "Escape")
            {
                this.cellEditing.CancelCellEditing(e, handler);
            }
            return;
        }

        // undo the written text and move selection of cell accordingly
        // column or row resize undo
        if ((e.ctrlKey) && e.key.toLowerCase() === "z") 
        {
            this.canvasUndoRedo.canvasUndo(e, handler);
        }

        // redo the erase text and move selection cell accordingly
        // redo the column or row resize 
        if ((e.ctrlKey) && e.key.toLowerCase() === "y") 
        {
            this.canvasUndoRedo.canvasRedo(e, handler);
        }

        if(this.editor.getElement().style.display !== "none")
            return;

        // Check if selection is broad/multicell by comparing bounds instead of selection.type string literal
        const isMultiCell = handler.selection && 
            (handler.selection.startRowIdx !== handler.selection.endRowIdx || 
             handler.selection.startColIdx !== handler.selection.endColIdx);

        if (e.key === "Enter" && handler.selection && isMultiCell) 
        {
            this.cellMove.moveSelectionInsideRange(handler);
            e.preventDefault();
            return;
        }

        if (handler.selection && (e.key.startsWith("Arrow") || e.key === "Enter")) 
        {
            const moveDetla = getMovementDelta(e);

            let rowDelta = moveDetla.rowDelta;
            let colDelta = moveDetla.colDelta;
            let isArrowKey = e.key.startsWith("Arrow");

            if (rowDelta !== 0 || colDelta !== 0) 
            {
                if (isArrowKey && e.shiftKey) 
                {
                    // Shift + Arrow Keys -> Expand Range Selection Box
                    this.cellRangeSelection.rangeSelectionUsingKey(rowDelta, colDelta, handler);
                }
                else if (isArrowKey && (e.ctrlKey)) 
                {
                    // Ctrl + Arrow Keys -> Fast Jump to Data Boundary 
                    this.reachtoDataBoundary.jumpToDataBoundary(rowDelta, colDelta, handler);
                } 
                else 
                {
                    // Single Arrow cell step movement
                    this.cellMove.moveSelection(rowDelta, colDelta, handler);
                }
                e.preventDefault();
                return;
            }
        }
        // render the inputBox on cell
        this.cellEditing.ActiveCell(handler, e);
    }
}