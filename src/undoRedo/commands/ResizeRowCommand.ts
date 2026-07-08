import type { ICommand } from "../ICommand.js";
import { Row } from "../../core/Row.js";

export class ResizeRowCommand implements ICommand 
{
    constructor(
        private row: Row,
        private newHeight: number,
        private oldHeight: number
    ) {}

    public execute(): void 
    {
        this.row.height = this.newHeight;
    }

    public undo(): void 
    {
        this.row.height = this.oldHeight;
    }
}