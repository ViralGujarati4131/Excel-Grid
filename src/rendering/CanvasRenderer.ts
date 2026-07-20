import type { IRenderer } from "./IRenderer.js";
import { Workbook } from "../core/Workbook.js";
import { Viewport } from "./Viewport.js";
import type { SelectionState } from "../utils/States.js";
import { ColumnAttributes, RowAttributes } from "../utils/Constants.js";

export class CanvasRenderer implements IRenderer 
{
    private ctx: CanvasRenderingContext2D | null;

    constructor(private canvas: HTMLCanvasElement) 
    {
        this.ctx = canvas.getContext("2d");
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
            x += col ? col.width : ColumnAttributes.DefaultWidth;
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
            y += row ? row.height : RowAttributes.DefaultHeight;
        }
        return y;
    }

    // this function will render the header, cells and multicell selection border
    public render(workbook: Workbook, viewport: Viewport, selection: SelectionState | null): void
    {   
        if(!this.ctx)
            return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.textBaseline = "middle";

        // calculate the total width and starting column
        let accumulatedW = 0;
        let startCol = 0;
        for (let c = 0; c < workbook.columns.length; c++) 
        {
            const col = workbook.columns[c];
            const w = col ? col.width : ColumnAttributes.DefaultWidth;

            if (accumulatedW + w < viewport.scrollX) 
                startCol = c + 1;

            accumulatedW += w;

            if (accumulatedW > viewport.scrollX + this.canvas.width) 
                break;
        }

        // calculate the total height and starting row
        let accumulatedH = 0;
        let startRow = 0;
        for (let r = 0; r < workbook.rows.length; r++) 
        {
            const row = workbook.rows[r];
            const h = row ? row.height : RowAttributes.DefaultHeight;

            if (accumulatedH + h < viewport.scrollY) 
                startRow = r + 1;
            
            accumulatedH += h;
            
            if (accumulatedH > viewport.scrollY + this.canvas.height) 
                break;
        }

        // calculate the end shell to draw in column and row
        const endCol = Math.min(workbook.columns.length, startCol + Math.ceil(this.canvas.width / 50) + 1);
        const endRow = Math.min(workbook.rows.length, startRow + Math.ceil(this.canvas.height / 20) + 1);  

        this.renderCells(workbook, viewport, startRow, endRow, startCol, endCol, selection);
        this.renderHeaders(workbook, viewport, startRow, endRow, startCol, endCol, selection);
        this.renderOriginCorner(viewport);
        this.renderRangeOuterOutline(workbook, viewport, selection);
    }

    // this method draw the header for the row and column and also high light it if it selected
    private renderHeaders(workbook: Workbook, viewport: Viewport, sR: number, eR: number, sC: number, eC: number, selection: SelectionState | null): void 
    {
        if(!this.ctx)
            return;

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
            if (!col) continue;

            const x = viewport.headerWidth + this.getColX(workbook, c) - viewport.scrollX;
            let isSelected = false;

            if (selection && selection.startColIdx !== undefined && selection.endColIdx !== undefined) 
            {
                const minC = Math.min(selection.startColIdx, selection.endColIdx);
                const maxC = Math.max(selection.startColIdx, selection.endColIdx);
                if (c >= minC && c <= maxC) isSelected = true;
            }
            
            ctx.fillStyle = isSelected ? "rgba(161,98,7,0.14)" : "#f5f4f0";
            ctx.fillRect(x, 0, col.width, viewport.headerHeight);
            ctx.strokeRect(x, 0, col.width, viewport.headerHeight);
            
            if (isSelected)
            {
                ctx.fillStyle = "#854d0e";
            }
            else
            {
                ctx.fillStyle = "#000000";
            }
            ctx.font = isSelected ? "bold 12px Arial" : "12px Arial";
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
            if (!row) continue;

            const y = viewport.headerHeight + this.getRowY(workbook, r) - viewport.scrollY;
            let isSelected = false;

            if (selection && selection.startRowIdx !== undefined && selection.endRowIdx !== undefined) 
            {
                const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
                const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);
                if (r >= minR && r <= maxR) isSelected = true;
            }

            ctx.fillStyle = isSelected ? "rgba(161,98,7,0.14)" : "#f5f4f0";
            ctx.fillRect(0, y, viewport.headerWidth, row.height);
            ctx.strokeRect(0, y, viewport.headerWidth, row.height);
            
            if (isSelected)
            {
                ctx.fillStyle = "#854d0e";
            }
            else
            {
                ctx.fillStyle = "#000000";
            }
            ctx.font = isSelected ? "bold 12px Arial" : "12px Arial";
            ctx.fillText(row.id.toString(), viewport.headerWidth / 2, y + row.height / 2);
        }
        ctx.restore();
    }

    // this is the method to show the cells in row cloumn and selection of cells and show the text of cell
    private renderCells(workbook: Workbook, viewport: Viewport, sR: number, eR: number, sC: number, eC: number, selection: SelectionState | null): void 
    {    
        if(!this.ctx)
            return;
        
        const ctx = this.ctx;

        ctx.save();
        ctx.beginPath();
        ctx.rect(viewport.headerWidth, viewport.headerHeight, this.canvas.width - viewport.headerWidth, this.canvas.height - viewport.headerHeight);
        ctx.clip();

        for (let r = sR; r < eR; r++) 
        {
            const row = workbook.rows[r];
            if (!row) continue;

            const y = viewport.headerHeight + this.getRowY(workbook, r) - viewport.scrollY;

            for (let c = sC; c < eC; c++) 
            {
                const col = workbook.columns[c];
                if (!col) continue;

                const cell = workbook.getCell(row.id, col.name);
                if (!cell) continue;

                const x = viewport.headerWidth + this.getColX(workbook, c) - viewport.scrollX;

                ctx.fillStyle = cell.style.backgroundColor;
                ctx.fillRect(x, y, col.width, row.height);

                if (selection && selection.startRowIdx !== undefined && selection.endRowIdx !== undefined && selection.startColIdx !== undefined && selection.endColIdx !== undefined) 
                {
                    const minR = Math.min(selection.startRowIdx, selection.endRowIdx);
                    const maxR = Math.max(selection.startRowIdx, selection.endRowIdx);
                    const minC = Math.min(selection.startColIdx, selection.endColIdx);
                    const maxC = Math.max(selection.startColIdx, selection.endColIdx);

                    if (r >= minR && r <= maxR && c >= minC && c <= maxC) 
                    {
                        const currentActiveR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : selection.startRowIdx;
                        const currentActiveC = selection.activeColIdx !== undefined ? selection.activeColIdx : selection.startColIdx;
                        
                        ctx.fillStyle = (r === currentActiveR && c === currentActiveC) ? "#ffffff" : "rgba(161,98,7,0.09)"; 
                        ctx.fillRect(x, y, col.width, row.height);
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
            }
        }
        ctx.restore();
    }

    // this will draw the selection broder for multiselection
    private renderRangeOuterOutline(workbook: Workbook, viewport: Viewport, selection: SelectionState | null): void 
    {
        if(!this.ctx)
            return;

        if (!selection || selection.startRowIdx === undefined || selection.endRowIdx === undefined || selection.startColIdx === undefined || selection.endColIdx === undefined)
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
            totalWidth += col ? col.width : ColumnAttributes.DefaultWidth;
        }

        let totalHeight = 0;
        for (let r = minR; r <= maxR; r++) 
        {
            const row = workbook.rows[r];
            totalHeight += row ? row.height : RowAttributes.DefaultHeight;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(viewport.headerWidth, viewport.headerHeight, this.canvas.width - viewport.headerWidth, this.canvas.height - viewport.headerHeight);
        ctx.clip();

        ctx.strokeStyle = "#a16207";
        ctx.lineWidth = 2;
        ctx.strokeRect(startX + 1, startY + 1, totalWidth - 2, totalHeight - 2);

        const currentActiveR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : selection.startRowIdx;
        const currentActiveC = selection.activeColIdx !== undefined ? selection.activeColIdx : selection.startColIdx;

        const anchorX = viewport.headerWidth + this.getColX(workbook, currentActiveC) - viewport.scrollX;
        const anchorY = viewport.headerHeight + this.getRowY(workbook, currentActiveR) - viewport.scrollY;

        const anchorCol = workbook.columns[currentActiveC];
        const anchorRow = workbook.rows[currentActiveR];
        if (anchorCol && anchorRow) 
        {
            ctx.strokeStyle = "#a16207";
            ctx.lineWidth = 1;
            ctx.strokeRect(anchorX + 1, anchorY + 1, anchorCol.width - 2, anchorRow.height - 2);
        }

        ctx.restore();
    }

    // this is the corner which is shown at (0,0) between the row & column header
    private renderOriginCorner(viewport: Viewport): void 
    {
        if(!this.ctx)
            return;

        const ctx = this.ctx;
        ctx.fillStyle = "#e6e6e6";
        ctx.fillRect(0, 0, viewport.headerWidth, viewport.headerHeight);
        ctx.strokeStyle = "#b4b4b4";
        ctx.strokeRect(0, 0, viewport.headerWidth, viewport.headerHeight);
    }
}