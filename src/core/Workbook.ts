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

    // calculate the count,min,max,sum and avg
    public calculateMetricsForRange(minR: number, maxR: number, minC: number, maxC: number) {
        let count = 0;
        let sum = 0;
        let numericCount = 0;
        let min = Infinity;
        let max = -Infinity;

        for (let r = minR; r <= maxR; r++) {
            const row = this.rows[r];
            if (!row) continue;

            for (let c = minC; c <= maxC; c++) {
                const col = this.columns[c];
                if (!col) continue;

                const cell = this.getCell(row.id, col.name);
                if (!cell || !cell.text.trim()) continue;

                count++;
                
                const numericValue = parseFloat(cell.text);
                if (!isNaN(numericValue)) {
                    numericCount++;
                    sum += numericValue;
                    if (numericValue < min) min = numericValue;
                    if (numericValue > max) max = numericValue;
                }
            }
        }

        return {
            count,
            hasNumeric: numericCount > 0,
            sum: sum,
            avg: numericCount > 0 ? (sum / numericCount) : 0,
            min: min === Infinity ? 0 : min,
            max: max === -Infinity ? 0 : max
        };
    }

    public loadJsonRecordSet(records: Array<{ id: number; firstName: string; lastName: string; Age: number; Salary: number }>): void {
        const targetRowCount = records.length;
        const requiredRows = targetRowCount + 1; 

        if (this.rows.length < requiredRows) {
            this.expandRows(requiredRows - this.rows.length);
        }
        if (this.columns.length < 5) {
            this.expandColumns(5 - this.columns.length);
        }

        const col0 = this.columns[0];
        const col1 = this.columns[1];
        const col2 = this.columns[2];
        const col3 = this.columns[3];
        const col4 = this.columns[4];

        if (!col0 || !col1 || !col2 || !col3 || !col4) {
            console.error("Dynamic Engine: Core structural columns allocation failed.");
            return;
        }

        const headerNames = ["ID", "First Name", "Last Name", "Age", "Salary"];
        const targetCols = [col0, col1, col2, col3, col4];
        
        for (let c = 0; c < 5; c++) {
            const currentColumn = targetCols[c];
            const currentName = headerNames[c];
            if (currentColumn && currentName) {
                const cell = this.getCell(1, currentColumn.name);
                if (cell) {
                    cell.text = currentName;
                    cell.style.font = "bold 13px Arial";
                    cell.style.backgroundColor = "#eaeaea";
                    cell.style.align = "left";
                }
            }
        }

        for (let i = 0; i < targetRowCount; i++) {
            const record = records[i];
            if (!record) continue; 

            const rowId = i + 2; 
            
            const cId = this.getCell(rowId, col0.name);
            if (cId) cId.text = record.id.toString();

            const cFirst = this.getCell(rowId, col1.name);
            if (cFirst) cFirst.text = record.firstName;

            const cLast = this.getCell(rowId, col2.name);
            if (cLast) cLast.text = record.lastName;

            const cAge = this.getCell(rowId, col3.name);
            if (cAge) cAge.text = record.Age.toString();

            const cSalary = this.getCell(rowId, col4.name);
            if (cSalary) cSalary.text = record.Salary.toString();
        }
    }
}