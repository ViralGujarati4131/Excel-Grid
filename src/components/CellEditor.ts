import { Cell } from "../core/Cell.js";
import { CommandHistory } from "../undoRedo/CommandHistory.js";
import { EditTextCommand } from "../undoRedo/commands/EditTextCommand.js";

export class CellEditor 
{
    private localInputHistory = new CommandHistory();
    private lastValueSnapshot = "";
    private initialValueBeforeEditing = "";
    constructor(private element: HTMLInputElement) 
    {
        this.hide();
        this.bindLocalHistoryEvents();
    }

    private bindLocalHistoryEvents(): void {
        this.element.addEventListener("input", () => {

            const currentValue = this.element.value;
            const cmd = new EditTextCommand(this, currentValue, this.lastValueSnapshot);
            this.localInputHistory.add(cmd);
            this.lastValueSnapshot = currentValue;
        });

        this.element.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === "z") {
                e.stopPropagation(); 
                e.preventDefault();
                this.localInputHistory.undo();
                this.lastValueSnapshot = this.element.value;
                return;
            }

            if (e.ctrlKey && e.key.toLowerCase() === "y") {
                e.stopPropagation(); 
                e.preventDefault();
                this.localInputHistory.redo();
                this.lastValueSnapshot = this.element.value; 
                return;
            }
        });
    }

    // this show the input box when user try to write in cell
    public show(cell: Cell, x: number, y: number, width: number, height: number, mode: "override" | "append"): void 
    {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.display = "block";

        this.initialValueBeforeEditing = cell.text;

        if (mode === "override") 
        {
            this.element.value = "";
        } 
        else 
        {
            this.element.value = cell.text;
        }
        this.element.focus();
        this.localInputHistory = new CommandHistory(); 
        this.lastValueSnapshot = this.element.value;
    }

    // get the value of the cell before start editing 
    public getInitialValue(): string 
    {
        return this.initialValueBeforeEditing;
    }

    // normally its hidden when user type that time only it will show
    public hide(): void 
    {
        this.element.style.display = "none";
    }

    // get the value of input field
    public getValue(): string 
    {
        return this.element.value;
    }

    // set the value of input field
    public setValue(val: string): void 
    {
        this.element.value = val;
    }

    // get the input element
    public getElement(): HTMLInputElement
    {
        return this.element;
    }
}