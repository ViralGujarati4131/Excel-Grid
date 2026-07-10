import type { IRenderer } from "./IRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "./Viewport.js";
import type { SelectionState } from "../eventsHandler/InteractionHandler.js";

export class CanvasRenderer implements IRenderer 
{
    private ctx: CanvasRenderingContext2D;

    constructor(private canvas: HTMLCanvasElement) 
    {
        this.ctx = canvas.getContext("2d")!;
    }

    // this return canvas element to draw
    public getCanvasElement(): HTMLCanvasElement 
    {
        return this.canvas;
    }

    // resize function so make canvas side according to the window size
    public resize(width: number, height: number): void 
    {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    // this give the x val to draw the cell
    public getColX(workbook: Workbook, targetIdx: number): number 
    {
        let x = 0;
        for (let i = 0; i < targetIdx; i++) 
        {
            const col = workbook.columns[i];
            x += col ? col.width : 100;
        }
        return x;
    }

    // this give the val of y to draw the cell
    public getRowY(workbook: Workbook, targetIdx: number): number 
    {
        let y = 0;
        for (let i = 0; i < targetIdx; i++) 
        {
            const row = workbook.rows[i];
            y += row ? row.height : 30;
        }
        return y;
    }

    // this function will render the header, cells and multicell selection border
    public render(workbook: Workbook, viewport: Viewport, selection: SelectionState | null): void
     {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.textBaseline = "middle";

        // calculate the total width and starting column
        let accumulatedW = 0;
        let startCol = 0;
        for (let c = 0; c < workbook.columns.length; c++) 
        {
            const col = workbook.columns[c];
            const w = col ? col.width : 100;
            if (accumulatedW + w < viewport.scrollX) startCol = c + 1;
            accumulatedW += w;
            if (accumulatedW > viewport.scrollX + this.canvas.width) break;
        }

        // calculate the total height and starting row
        let accumulatedH = 0;
        let startRow = 0;
        for (let r = 0; r < workbook.rows.length; r++) 
        {
            const row = workbook.rows[r];
            const h = row ? row.height : 30;
            if (accumulatedH + h < viewport.scrollY) startRow = r + 1;
            accumulatedH += h;
            if (accumulatedH > viewport.scrollY + this.canvas.height) break;
        }

        // calculate the end shell to draw in column and row
        const endCol = Math.min(workbook.columns.length, startCol + Math.ceil(this.canvas.width / 50) + 1);
        const endRow = Math.min(workbook.rows.length, startRow + Math.ceil(this.canvas.height / 20) + 1);  

        this.renderCells(workbook, viewport, startRow, endRow, startCol, endCol, selection);
        this.renderHeaders(workbook, viewport, startRow, endRow, startCol, endCol, selection);
        this.renderOriginCorner(viewport);
        this.renderRangeOuterOutline(workbook, viewport, selection);
    }

    // this method draw the header for the row and column and also high light it if it selected raw | column | range
    private renderHeaders(workbook: Workbook, viewport: Viewport, sR: number, eR: number, sC: number, eC: number, selection: SelectionState | null): void 
    {
        const ctx = this.ctx;
        ctx.strokeStyle = "#b4b4b4";
        ctx.textAlign = "center";
        ctx.font = "12px Arial";

        // column header display and selection state of it
        ctx.save();
        ctx.beginPath();
        ctx.rect(viewport.headerWidth, 0, this.canvas.width - viewport.headerWidth, viewport.headerHeight);        
        ctx.clip();

        for (let c = sC; c < eC; c++) 
        {
            const col = workbook.columns[c];

            if (!col) 
                continue;

            const x = viewport.headerWidth + this.getColX(workbook, c) - viewport.scrollX;
            let isSelectedColumn = false;
            let isSelectedRange = false;
            let isSelectedColumnRange = false;
            let isSelectedCell = false;

            if (selection) 
            {
                if(selection.type === "cell" && selection.colName === col.name)
                    isSelectedCell = true;

                if (selection.type === "column" && selection.colName === col.name) 
                    isSelectedColumn = true;

                if (selection.type === "range" && selection.startColIdx !== undefined && selection.endColIdx !== undefined) 
                {
                    const minC = Math.min(selection.startColIdx, selection.endColIdx);
                    const maxC = Math.max(selection.startColIdx, selection.endColIdx);

                    if (c >= minC && c <= maxC) 
                        isSelectedRange = true;
                }

                if (selection.type === "columnRange" && selection.startColIdx !== undefined && selection.endColIdx !== undefined) 
                {
                    
                    const minC = Math.min(selection.startColIdx, selection.endColIdx);
                    const maxC = Math.max(selection.startColIdx, selection.endColIdx);

                    if (c >= minC && c <= maxC) 
                        isSelectedColumnRange = true;
                }

            }
            
            if(isSelectedColumn || isSelectedRange || isSelectedColumnRange || isSelectedCell)
            {
                if(isSelectedColumn || isSelectedColumnRange)
                {
                    ctx.fillStyle = "#107C41";
                }
                if(isSelectedRange || isSelectedCell)
                {
                    ctx.fillStyle = "#bff5cf";
                }
            }
            else
            {
                ctx.fillStyle = "#f3f3f3";
            }
            ctx.fillRect(x, 0, col.width, viewport.headerHeight);
            ctx.strokeRect(x, 0, col.width, viewport.headerHeight);
            
            if(isSelectedColumn || isSelectedRange || isSelectedColumnRange || isSelectedCell)
            {
                if(isSelectedColumn || isSelectedColumnRange)
                {
                    ctx.fillStyle = "#E2FAE9";
                }
                if(isSelectedRange || isSelectedCell)
                {                    
                    ctx.fillStyle = "#107C41";

                    if(selection?.rowId != 1)
                    {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, viewport.headerHeight - 2);        
                        ctx.lineTo(x + col.width, viewport.headerHeight - 2); 
                        ctx.strokeStyle = "#107C41";      
                        ctx.lineWidth = 2;                 
                        ctx.stroke();
                        ctx.restore();  
                    }
                }
            }
            else
            {
                ctx.fillStyle = "#000000";
            }
            ctx.font = isSelectedColumn || isSelectedColumnRange || isSelectedRange ? "bold 12px Arial" : "12px Arial";
            ctx.fillText(col.name, x + col.width / 2, viewport.headerHeight / 2);
        }
        ctx.restore();


        // row header display and selection state of it
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, viewport.headerHeight, viewport.headerWidth, this.canvas.height - viewport.headerHeight);
        ctx.clip();

        for (let r = sR; r < eR; r++) 
        {
            const row = workbook.rows[r];

            if (!row) 
                continue;

            const y = viewport.headerHeight + this.getRowY(workbook, r) - viewport.scrollY;
            let isSelectedRow = false;
            let isSelectedRange = false;
            let isSelectedRowRange = false;
            let isSelectedCell = false;

            if (selection) 
            {
                if (selection.type === "cell" && selection.rowId === row.id) 
                    isSelectedCell = true;

                if (selection.type === "row" && selection.rowId === row.id) 
                    isSelectedRow = true;

                if (selection.type === "range" && selection.startRowIdx !== undefined && selection.endRowIdx !== undefined) 
                {
                    const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
                    const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);

                    if (r >= minR && r <= maxR) 
                        isSelectedRange = true;
                }

                if (selection.type === "rowRange" && selection.startRowIdx !== undefined && selection.endRowIdx !== undefined) 
                {
                    const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
                    const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);

                    if (r >= minR && r <= maxR) 
                        isSelectedRowRange = true;
                }
            }

            if(isSelectedRow || isSelectedRange || isSelectedRowRange || isSelectedCell)
            {
                if(isSelectedRow || isSelectedRowRange)
                {
                    ctx.fillStyle = "#107C41";
                }
                if(isSelectedRange || isSelectedCell)
                {
                    ctx.fillStyle = "#bff5cf";
                }
            }
            else
            {
                ctx.fillStyle = "#f3f3f3";
            }
            ctx.fillRect(0, y, viewport.headerWidth, row.height);
            ctx.strokeRect(0, y, viewport.headerWidth, row.height);
            
           
             if(isSelectedRow || isSelectedRange || isSelectedRowRange || isSelectedCell)
            {
                if(isSelectedRow || isSelectedRowRange)
                {
                    ctx.fillStyle = "#E2FAE9";
                }
                if(isSelectedRange || isSelectedCell)
                {
                    ctx.fillStyle = "#107C41";

                    if(selection?.startColIdx != 0)
                    {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(viewport.headerWidth - 2, y);        
                        ctx.lineTo(viewport.headerWidth - 2, y + row.height); 
                        ctx.strokeStyle = "#107C41";      
                        ctx.lineWidth = 2;                 
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
            else
            {
                ctx.fillStyle = "#000000";
            }
            ctx.font = isSelectedRow || isSelectedRange ? "bold 12px Arial" : "12px Arial";
            ctx.fillText(row.id.toString(), viewport.headerWidth / 2, y + row.height / 2);
        }
        ctx.restore();
    }

    // this is the method to show the cells in row cloumn and selection of cells and show the text of cell
    private renderCells(workbook: Workbook, viewport: Viewport, sR: number, eR: number, sC: number, eC: number, selection: SelectionState | null): void {
        const ctx = this.ctx;

        ctx.save();
        ctx.beginPath();
        ctx.rect(viewport.headerWidth, viewport.headerHeight, this.canvas.width - viewport.headerWidth, this.canvas.height - viewport.headerHeight);
        ctx.clip();

        for (let r = sR; r < eR; r++) 
        {
            const row = workbook.rows[r];

            if (!row) 
                continue;

            const y = viewport.headerHeight + this.getRowY(workbook, r) - viewport.scrollY;

            for (let c = sC; c < eC; c++) 
            {
                const col = workbook.columns[c];
                if (!col) 
                    continue;

                const cell = workbook.getCell(row.id, col.name);
                if (!cell) 
                    continue;

                const x = viewport.headerWidth + this.getColX(workbook, c) - viewport.scrollX;

                ctx.fillStyle = cell.style.backgroundColor;
                ctx.fillRect(x, y, col.width, row.height);

                if (selection) 
                {
                    // if entire column selected
                    if ((selection.type === "column") && selection.colName === col.name) 
                    {
                        ctx.fillStyle = "#E2F0E9";
                        ctx.fillRect(x, y, col.width, row.height);
                    } 
                    // if entire row is selected
                    else if (selection.type === "row" && selection.rowId === row.id) 
                    {
                        ctx.fillStyle = "#E2F0E9";
                        ctx.fillRect(x, y, col.width, row.height);
                    } 
                    // if range of cell | row | column is selected 
                    else if ((selection.type === "range" || selection.type === "columnRange" || selection.type === "rowRange") && selection.startRowIdx !== undefined && selection.endRowIdx !== undefined && selection.startColIdx !== undefined && selection.endColIdx !== undefined) 
                    {
                        const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
                        const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);
                        const minC = Math.min(selection.startColIdx, selection.endColIdx);
                        const maxC = Math.max(selection.startColIdx, selection.endColIdx);

                        if (r >= minR && r <= maxR && c >= minC && c <= maxC) 
                        {
                            if (r === selection.startRowIdx && c === selection.startColIdx && selection.type === "range") 
                            {
                                ctx.fillStyle = "#ffffff";
                            } 
                            else 
                            {
                                ctx.fillStyle = "#E2F0E9";
                            }
                            ctx.fillRect(x, y, col.width, row.height);
                        }
                    }
                }
                
                ctx.strokeStyle = "#e0e0e0";
                ctx.strokeRect(x, y, col.width, row.height);

                if (cell.text) 
                {
                    ctx.fillStyle = cell.style.textColor;
                    ctx.font = cell.style.font;
                    ctx.textAlign = cell.style.align;
                    ctx.fillText(cell.text, x + 6, y + row.height / 2);
                }

                // only one cell is selected
                if (selection && selection.type === "cell" && selection.rowId === row.id && selection.colName === col.name)
                {
                    ctx.strokeStyle = "#107C41";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, col.width - 2, row.height - 2);
                    ctx.lineWidth = 1;
                }
            }
        }
        ctx.restore();
    }

    // this will draw the selection broder for multi row | column | cell selection
    private renderRangeOuterOutline(workbook: Workbook, viewport: Viewport, selection: SelectionState | null): void 
    {
        if (!selection || selection.type === "cell"|| selection.startRowIdx === undefined || selection.endRowIdx === undefined || selection.startColIdx === undefined || selection.endColIdx === undefined)
            return;

        const ctx = this.ctx;
        
        const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
        const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);
        const minC = Math.min(selection.startColIdx, selection.endColIdx);
        const maxC = Math.max(selection.startColIdx, selection.endColIdx);

        const startX = viewport.headerWidth + this.getColX(workbook, minC) - viewport.scrollX;
        const startY = viewport.headerHeight + this.getRowY(workbook, minR) - viewport.scrollY;

        let totalWidth = 0;
        for (let c = minC; c <= maxC; c++) 
        {
            const col = workbook.columns[c];
            totalWidth += col ? col.width : 100;
        }

        let totalHeight = 0;
        for (let r = minR; r <= maxR; r++) 
        {
            const row = workbook.rows[r];
            totalHeight += row ? row.height : 30;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(viewport.headerWidth, viewport.headerHeight, this.canvas.width - viewport.headerWidth, this.canvas.height - viewport.headerHeight);
        ctx.clip();

        ctx.strokeStyle = "#107C41";
        ctx.lineWidth = 2;
        ctx.strokeRect(startX + 1, startY + 1, totalWidth - 2, totalHeight - 2);
        
        // high light first cell of range if only range is selected
        if(selection.type == "range")
        {
            const anchorX = viewport.headerWidth + this.getColX(workbook, selection.startColIdx) - viewport.scrollX;
            const anchorY = viewport.headerHeight + this.getRowY(workbook, selection.startRowIdx) - viewport.scrollY;
            
            const anchorCol = workbook.columns[selection.startColIdx];
            const anchorRow = workbook.rows[selection.startRowIdx];
            if (anchorCol && anchorRow) 
            {
                ctx.strokeStyle = "#107C41";
                ctx.lineWidth = 1;
                ctx.strokeRect(anchorX + 1, anchorY + 1, anchorCol.width - 2, anchorRow.height - 2);
            }
        }
        ctx.restore();
    }

    // this is the corner which is shown at (0,0) between the row & column header
    private renderOriginCorner(viewport: Viewport): void 
    {
        const ctx = this.ctx;
        ctx.fillStyle = "#e6e6e6";
        ctx.fillRect(0, 0, viewport.headerWidth, viewport.headerHeight);
        ctx.strokeStyle = "#b4b4b4";
        ctx.strokeRect(0, 0, viewport.headerWidth, viewport.headerHeight);
    }
}