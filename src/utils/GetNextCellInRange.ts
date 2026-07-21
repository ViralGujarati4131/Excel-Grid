import { RangeSelectionManage } from "./RangeSelectionManage.js";
import type { SelectionState } from "./States.js";

export function getNextCellWithinRange(selection: SelectionState): { rowIdx: number; colIdx: number } 
{
    const bounds = RangeSelectionManage.normalizeSelection(selection);

    let currentR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : (selection.startRowIdx ?? bounds.minR);
    let currentC = selection.activeColIdx !== undefined ? selection.activeColIdx : (selection.startColIdx ?? bounds.minC);

    currentR++;

    if (currentR > bounds.maxR) 
    {
        currentR = bounds.minR;   
        currentC += 1;       

        if (currentC > bounds.maxC) 
            currentC = bounds.minC;
    } 

    return { rowIdx: currentR, colIdx: currentC };
}