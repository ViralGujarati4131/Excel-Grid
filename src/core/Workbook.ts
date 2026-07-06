import { Row } from "./Row.js";
import { Column } from "./Column.js";
import { Cell } from "./Cell.js";

export class Workbook {
    public rows: Row[] = [];
    public columns: Column[] = [];
    private cells: Map<string, Cell> = new Map();

    // max rows
    private readonly MAX_ROWS = 100000;
    
    // max cloumns
    private readonly MAX_COLS = 500;

    constructor(initialRowCount: number, initialColCount: number) {
        this.initializeDimensions(initialRowCount, initialColCount);
        this.initializeCellsForRange(0, initialRowCount, 0, initialColCount);
    }

    // create the initial stage row, columns
    private initializeDimensions(rowCount: number, colCount: number): void {
        for (let r = 1; r <= rowCount; r++) {
            this.rows.push(new Row(r));
        }
        for (let c = 0; c < colCount; c++) {
            this.columns.push(new Column(c, this.indexToColName(c)));
        }
    }

    // create the cell range wise
    private initializeCellsForRange(startRowIndex: number, endRowCount: number, startColIndex: number, endColCount: number): void {
        for (let r = startRowIndex; r < endRowCount; r++) {
            const row = this.rows[r];
            if (!row) continue;
            
            for (let c = startColIndex; c < endColCount; c++) {
                const col = this.columns[c];
                if (!col) continue;

                const cell = new Cell(row, col);
                this.cells.set(cell.id, cell);
            }
        }
    }

    // expand the rows when scroll near to reach at end
    public expandRows(batchSize: number = 50): void {
        const currentCount = this.rows.length;
        if (currentCount >= this.MAX_ROWS) return;

        const targetCount = Math.min(this.MAX_ROWS, currentCount + batchSize);
        const addedCount = targetCount - currentCount;

        for (let r = currentCount + 1; r <= targetCount; r++) {
            this.rows.push(new Row(r));
        }
    
        this.initializeCellsForRange(currentCount, targetCount, 0, this.columns.length);
        console.log(`Dynamic Engine: Rows scaled upward to ${targetCount}`);
    }

    // expand the cloumns when scroll near to reach at end
    public expandColumns(batchSize: number = 20): void {
        const currentCount = this.columns.length;
        if (currentCount >= this.MAX_COLS) return;

        const targetCount = Math.min(this.MAX_COLS, currentCount + batchSize);

        for (let c = currentCount; c < targetCount; c++) {
            this.columns.push(new Column(c, this.indexToColName(c)));
        }

        this.initializeCellsForRange(0, this.rows.length, currentCount, targetCount);
        console.log(`Dynamic Engine: Columns scaled upward to ${targetCount}`);
    }

    // get the cell
    public getCell(rowId: number, colName: string): Cell | undefined {
        return this.cells.get(`${colName}${rowId}`);
    }

    // map index to column name
    private indexToColName(index: number): string {
        let name = "";
        let coord = index + 1;
        while (coord > 0) {
            let rem = (coord - 1) % 26;
            name = String.fromCharCode(65 + rem) + name;
            coord = Math.floor((coord - 1) / 26);
        }
        return name;
    }
}