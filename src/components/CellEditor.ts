import { Cell } from "../core/Cell.js";

export class CellEditor {
    constructor(private element: HTMLInputElement) {
        this.hide();
    }

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

    public hide(): void {
        this.element.style.display = "none";
    }

    public getValue(): string {
        return this.element.value;
    }

    public setValue(val: string): void {
        this.element.value = val;
    }

    public getElement(): HTMLInputElement {
        return this.element;
    }
}