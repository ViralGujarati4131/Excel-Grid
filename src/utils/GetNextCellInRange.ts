import type { SelectionState } from "./States.js";

export function getNextCellWithinRange(selection: SelectionState, rowDelta: number, colDelta: number, maxRows: number, maxCols: number): { rowIdx: number; colIdx: number } 
{
    let minR = 0, maxR = maxRows - 1;
    let minC = 0, maxC = maxCols - 1;

    if (selection.startRowIdx !== undefined && selection.endRowIdx !== undefined && selection.startColIdx !== undefined && selection.endColIdx !== undefined) {
        minR = Math.min(selection.startRowIdx, selection.endRowIdx);
        maxR = Math.max(selection.startRowIdx, selection.endRowIdx);
        minC = Math.min(selection.startColIdx, selection.endColIdx);
        maxC = Math.max(selection.startColIdx, selection.endColIdx);
    }

    let currentR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : (selection.startRowIdx ?? minR);
    let currentC = selection.activeColIdx !== undefined ? selection.activeColIdx : (selection.startColIdx ?? minC);

    if (minC === 0 && maxC === maxCols - 1 && minR === maxR) {
        currentC += 1; 
    } else {
        currentR += rowDelta;
        currentC += colDelta;
    }

    if (currentR > maxR) {
        currentR = minR;   
        currentC += 1;            
        if (currentC > maxC) currentC = minC;
    } else if (currentR < minR) {
        currentR = maxR;
        currentC -= 1;
        if (currentC < minC) currentC = maxC;
    }

    if (currentC > maxC) {
        currentC = minC;
        currentR += 1;
        if (currentR > maxR) currentR = minR;
    } else if (currentC < minC) {
        currentC = maxC;
        currentR -= 1;
        if (currentR < minR) currentR = maxR;
    }

    return { rowIdx: currentR, colIdx: currentC };
}