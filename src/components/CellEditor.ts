import { Cell } from "../core/Cell.js";

export class CellEditor {
    constructor(private element: HTMLInputElement) {
        this.hide();
    }

    // this show the input box when user try to write in cell
    public show(cell: Cell, x: number, y: number, width: number, height: number, mode: "override" | "append"): void {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.display = "block";

        if (mode === "override") {
            this.element.value = "";
        } else {
            this.element.value = cell.text;
            this.element.setSelectionRange(this.element.value.length, this.element.value.length);
        }
        this.element.focus();
    }

    // normally its hidden when user type that time only it will show
    public hide(): void {
        this.element.style.display = "none";
    }

    // get the value of input field
    public getValue(): string {
        return this.element.value;
    }

    // set the value of input field
    public setValue(val: string): void {
        this.element.value = val;
    }

    // get the input element
    public getElement(): HTMLInputElement {
        return this.element;
    }
}