import { Row } from "./Row.js";
import { Column } from "./Column.js";

// basic style for cell
export interface CellStyle 
{
    font: string;
    textColor: string;
    backgroundColor: string;
    align: CanvasTextAlign;
}


// cell class is using row id and cloun id to create cell id and also generate cell from row & column
export class Cell 
{
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
    ) 
    {
        this.id = `${column.name}${row.id}`;
    }
}