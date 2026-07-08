import { Row } from "./Row.js";
import { Column } from "./Column.js";
import { Cell } from "./Cell.js";

export class Workbook 
{
    public rows: Row[] = [];
    public columns: Column[] = [];
    private cells: Map<string, Cell> = new Map();

    // max rows
    private readonly MAX_ROWS = 100000;
    
    // max cloumns
    private readonly MAX_COLS = 500;

    constructor(initialRowCount: number, initialColCount: number) 
    {
        this.initializeDimensions(initialRowCount, initialColCount);
        this.initializeCellsForRange(0, initialRowCount, 0, initialColCount);
    }

    // create the initial stage row, columns
    private initializeDimensions(rowCount: number, colCount: number): void 
    {
        for (let r = 1; r <= rowCount; r++) 
        {
            this.rows.push(new Row(r));
        }
        for (let c = 0; c < colCount; c++) 
        {
            this.columns.push(new Column(c, this.indexToColName(c)));
        }
    }

    // create the cell range wise
    private initializeCellsForRange(startRowIndex: number, endRowCount: number, startColIndex: number, endColCount: number): void 
    {
        for (let r = startRowIndex; r < endRowCount; r++) 
        {
            const row = this.rows[r];

            if (!row) 
                continue;
            
            for (let c = startColIndex; c < endColCount; c++) 
            {
                const col = this.columns[c];

                if (!col) 
                    continue;

                const cell = new Cell(row, col);
                this.cells.set(cell.id, cell);
            }
        }
    }

    // expand the rows when scroll near to reach at end
    public expandRows(batchSize: number = 50): void 
    {
        const currentCount = this.rows.length;

        if (currentCount >= this.MAX_ROWS) 
            return;

        const targetCount = Math.min(this.MAX_ROWS, currentCount + batchSize);

        for (let r = currentCount + 1; r <= targetCount; r++) 
        {
            this.rows.push(new Row(r));
        }
    
        this.initializeCellsForRange(currentCount, targetCount, 0, this.columns.length);
    }

    // expand the cloumns when scroll near to reach at end
    public expandColumns(batchSize: number = 20): void 
    {
        const currentCount = this.columns.length;

        if (currentCount >= this.MAX_COLS) 
            return;

        const targetCount = Math.min(this.MAX_COLS, currentCount + batchSize);

        for (let c = currentCount; c < targetCount; c++) 
        {
            this.columns.push(new Column(c, this.indexToColName(c)));
        }

        this.initializeCellsForRange(0, this.rows.length, currentCount, targetCount);
    }

    // get the cell
    public getCell(rowId: number, colName: string): Cell | undefined 
    {
        return this.cells.get(`${colName}${rowId}`);
    }

    // map index to column name
    private indexToColName(index: number): string 
    {
        let name = "";
        let coord = index + 1;

        while (coord > 0) 
        {
            let rem = (coord - 1) % 26;
            name = String.fromCharCode(65 + rem) + name;
            coord = Math.floor((coord - 1) / 26);
        }

        return name;
    }

    // calculate the count,min,max,sum and avg
    public calculateMetricsForRange(minR: number, maxR: number, minC: number, maxC: number) 
    {
        let count = 0;
        let sum = 0;
        let numericCount = 0;
        let min = Infinity;
        let max = -Infinity;

        for (let r = minR; r <= maxR; r++) 
        {
            const row = this.rows[r];

            if (!row) 
                continue;

            for (let c = minC; c <= maxC; c++) 
            {
                const col = this.columns[c];

                if (!col) 
                    continue;

                const cell = this.getCell(row.id, col.name);

                if (!cell || !cell.text.trim()) 
                    continue;

                count++;
                
                const numericValue = parseFloat(cell.text);

                if (!isNaN(numericValue)) 
                {
                    numericCount++;
                    sum += numericValue;

                    if (numericValue < min) 
                        min = numericValue;

                    if (numericValue > max) 
                        max = numericValue;
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

    // this is to store the json values into the cell text 
    public loadJsonRecordSet(records2: any[],headerNames: string[]): void 
    {
        const targetRowCount = records2.length;
        const requiredRows = targetRowCount + 1; 

        if (this.rows.length < requiredRows) 
        {
            this.expandRows(requiredRows - this.rows.length);
        }        

        const requiredColumns = headerNames.length;        

        if (this.columns.length < requiredColumns) 
        {
            this.expandColumns(requiredColumns - this.columns.length);
        }

        
        for (let c = 0; c < headerNames.length; c++) 
        {
            const cell = this.getCell(1, this.columns[c]!.name);

            if (cell) 
            {
                cell.text = headerNames[c]!;
                cell.style.font = "bold 13px Arial";
                cell.style.backgroundColor = "#eaeaea";
                cell.style.align = "left";
            }
        }

        for (let i = 0; i < requiredRows; i++) 
        {
            const record = records2[i];
            
            if (!record) 
                continue; 

            const rowId = i + 2; 

            headerNames.forEach((key, j) => {
                const colName = this.columns[j]?.name;
                const cell = this.getCell(rowId, colName!);

                if (cell) {
                    const value = record[key as keyof typeof record];
                    
                    cell.text = value != null && value !== ""
                        ? value.toString()
                        : (typeof value === "string"
                            ? "null" 
                            : `${i + 1}`);
                }
            });
        }
    }

    // clear all data
    public clearAllCellsText(): void {
    for (const row of this.rows) {
        for (const col of this.columns) {
            const cell = this.getCell(row.id, col.name);
            if (cell) {
                cell.text = ""; 
                if (cell.style) {
                    cell.style.backgroundColor = "#ffffff"; 
                }
            }
        }
    }
}

}