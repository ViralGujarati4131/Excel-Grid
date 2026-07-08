import type { ICommand } from "../ICommand.js";
import { Column } from "../../core/Column.js";

export class ResizeColumnCommand implements ICommand 
{
    constructor(
        private column: Column,
        private newWidth: number,
        private oldWidth: number
    ) {}

    public execute(): void 
    {
        this.column.width = this.newWidth;
    }

    public undo(): void 
    {
        this.column.width = this.oldWidth;
    }
}