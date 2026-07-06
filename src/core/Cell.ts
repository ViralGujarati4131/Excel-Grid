import { Row } from "./Row.js";
import { Column } from "./Column.js";

// basci style for cell
export interface CellStyle {
    font: string;
    textColor: string;
    backgroundColor: string;
    align: CanvasTextAlign;
}


// cell class which is made using row and cloun and cell id also generate from that row & column id's
export class Cell {
    public readonly id: string;
    
    constructor(
        public readonly row: Row,
        public readonly column: Column,
        public text: string = "",
        public style: CellStyle = {
            font: "14px Arial",
            textColor: "#000000",
            backgroundColor: "#ffffff",
            align: "left"
        }
    ) {
        this.id = `${column.name}${row.id}`;
    }
}