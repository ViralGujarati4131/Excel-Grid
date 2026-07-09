import type { ICommand } from "../ICommand.js";
import type { CellEditor } from "../../components/CellEditor.js";

export class EditTextCommand implements ICommand 
{
    constructor(
        private editor: CellEditor,
        private newValue: string,
        private oldValue: string 
    ) {
    }

    public execute(): void 
    {
        this.editor.setValue(this.newValue);
    }

    public undo(): void 
    {
        this.editor.setValue(this.oldValue);
    }
}