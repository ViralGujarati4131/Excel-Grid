import type { ICommand } from "../ICommand.js";
import { Cell } from "../../core/Cell.js";

export class WriteTextCommand implements ICommand {
    constructor(
        private cell: Cell,
        private newValue: string,
        private oldValue: string,
        public readonly rowIdx: number,
        public readonly colIdx: number
    ) {}

    public execute(): void {
        this.cell.text = this.newValue;
    }

    public undo(): void {
        this.cell.text = this.oldValue;
    }
}