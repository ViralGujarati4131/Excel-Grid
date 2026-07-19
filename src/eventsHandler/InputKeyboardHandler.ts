import type { CellEditor } from "../components/CellEditor.js";
import type { CellMove } from "../functionality/CellMove.js";
import type { InteractionHandler } from "./InteractionHandler.js";

export class InputKeyboardHandler
{
    constructor(
        private editor: CellEditor,
        private cellMove: CellMove
    )
    {}

    public handleKeyDown(e: KeyboardEvent, handler: InteractionHandler)
    {
        if (e.key === "Enter") 
        {
            e.stopPropagation(); 
            this.editor.getElement().blur();
            
            const isMultiCell = handler.selection && 
                (handler.selection.startRowIdx !== handler.selection.endRowIdx || 
                 handler.selection.startColIdx !== handler.selection.endColIdx);

            // move inside if the range selection only
            if (handler.selection && isMultiCell) 
            {
                this.cellMove.moveSelectionInsideRange(handler);
            } 
            // move down normally
            else 
            {
                this.cellMove.moveSelection(1, 0, handler); 
            }
            e.preventDefault();
        }
    }
}