import { Row } from "./Row.js";
import { Column } from "./Column.js";
import { Cell } from "./Cell.js";
import { ColumnAttributes, RowAttributes } from "../utils/Constants.js";

export class Workbook 
{
    public rows: Row[] = [];
    public columns: Column[] = [];
    private cells: Map<string, Cell> = new Map();

    private cachedJsonRecords: any[] = [];
    private cachedHeaders: string[] = [];

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

                if(r < this.cachedJsonRecords.length && c < this.cachedHeaders.length)
                    this.fillCellFromCache(cell,c);
            }
        }
    }

    // fill cell from cached data as per the required while scrolling 
    private fillCellFromCache(cell: Cell, colIndex: number): void
    {
        if(this.cachedJsonRecords.length === 0) 
            return;

        if (cell.row.id === 1) 
        {
            if (this.cachedHeaders[colIndex]) 
            {
                cell.text = this.cachedHeaders[colIndex];
                cell.style.font = "bold 13px Arial";
                cell.style.backgroundColor = "#eaeaea";
                cell.style.align = "left";
            }
            return;
        }
        
        const recordIndex = cell.row.id - 2;
        
        const record = this.cachedJsonRecords[recordIndex];

        if (!record) 
            return;

        const key = this.cachedHeaders[colIndex];
        
        if(key) 
        {
            const value = record[key];

            cell.text = value != null && value !== ""
                ? value.toString()
                : (typeof value === "string" ? "null" : `${recordIndex + 1}`);
        }
    }

    // expand the rows when scroll near to reach at end
    public expandRows(batchSize: number): void 
    {   
        const currentCount = this.rows.length;

        if (currentCount >= RowAttributes.MaxRows) 
            return;

        const targetCount = Math.min(RowAttributes.MaxRows, currentCount + batchSize);

        for (let r = currentCount + 1; r <= targetCount; r++) 
        {
            this.rows.push(new Row(r));
        }
    
        this.initializeCellsForRange(currentCount, targetCount, 0, this.columns.length);
    }

    // expand the cloumns when scroll near to reach at end
    public expandColumns(batchSize: number): void 
    {
        const currentCount = this.columns.length;

        if (currentCount >= ColumnAttributes.MaxColumns) 
            return;

        const targetCount = Math.min(ColumnAttributes.MaxColumns, currentCount + batchSize);

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
            numericCount: numericCount,
            sum: sum,
            avg: numericCount > 0 ? (sum / numericCount) : 0,
            min: min === Infinity ? 0 : min,
            max: max === -Infinity ? 0 : max
        };
    }

    // cached all data and fill the initial data to cell
    public loadJsonRecordSet(records: any[], headerNames: string[]): void 
    {
        this.cachedJsonRecords = records;
        this.cachedHeaders = headerNames;

        const initialRequiredRows = Math.min(this.rows.length, records.length + 1);
        const initialRequiredCols = Math.min(this.columns.length, headerNames.length);

        for (let r = 0; r < initialRequiredRows; r++) 
        {
            for (let c = 0; c < initialRequiredCols; c++) 
            {
                const row = this.rows[r];
                const col = this.columns[c];
                if (row && col) 
                {
                    const cell = this.getCell(row.id, col.name);
                    if (cell) 
                    {
                        this.fillCellFromCache(cell, c);
                    }
                }
            }
        }
    }

    // clear all data
    public clearAllCellsText(): void 
    {
        for (const row of this.rows) 
        {
            for (const col of this.columns) 
            {
                const cell = this.getCell(row.id, col.name);

                if (cell) 
                {
                    cell.text = ""; 
                    
                    if (cell.style) 
                    {
                        cell.style.backgroundColor = "#ffffff"; 
                    }
                }
            }
        }
    }
}