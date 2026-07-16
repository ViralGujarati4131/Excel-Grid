import type { CellEditor } from "../components/CellEditor.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";

export class ClearSelection{
    constructor(
        private editor: CellEditor
    )
    {}

    public clearSelection(handler: InteractionHandler)
    {
        handler.selection = null;
        handler.cellState = null;
        handler.rowState = null;
        handler.columnState = null;
        this.editor.hide();
        handler.updateView();
    }
}