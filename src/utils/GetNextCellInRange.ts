import { RangeSelectionManage } from "./RangeSelectionManage.js";
import type { SelectionState } from "./States.js";

export function getNextCellWithinRange(selection: SelectionState, rowDelta: number, colDelta: number, maxRows: number, maxCols: number): { rowIdx: number; colIdx: number } 
{
    const bounds = RangeSelectionManage.normalizeSelection(selection);

    let currentR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : (selection.startRowIdx ?? bounds.minR);
    let currentC = selection.activeColIdx !== undefined ? selection.activeColIdx : (selection.startColIdx ?? bounds.minC);

    if (bounds.minC === 0 && bounds.maxC === maxCols - 1 && bounds.minR === bounds.maxR) 
    {
        currentC += 1; 
    } 
    else 
    {
        currentR += rowDelta;
        currentC += colDelta;
    }

    if (currentR > bounds.maxR) 
    {
        currentR = bounds.minR;   
        currentC += 1;       

        if (currentC > bounds.maxC) 
            currentC = bounds.minC;
    } 
    else if (currentR < bounds.minR) 
    {
        currentR = bounds.maxR;
        currentC -= 1;

        if (currentC < bounds.minC) 
            currentC = bounds.maxC;
    }

    if (currentC > bounds.maxC) 
    {
        currentC = bounds.minC;
        currentR += 1;

        if (currentR > bounds.maxR) 
            currentR = bounds.minR;
    } 
    else if (currentC < bounds.minC) 
    {
        currentC = bounds.maxC;
        currentR -= 1;

        if (currentR < bounds.minR) 
            currentR = bounds.maxR;
    }

    return { rowIdx: currentR, colIdx: currentC };
}