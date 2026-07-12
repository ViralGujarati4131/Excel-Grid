import type { SelectionState } from "../eventsHandler/InteractionHandler.js";
import { RangeSelectionManage } from "./RangeSelectionManage.js";

export function getNextCellWithinRange(selection: SelectionState, rowDelta: number, colDelta: number, maxRows: number, maxCols: number): { rowIdx: number; colIdx: number } 
{
    let minR = 0, maxR = maxRows - 1;
    let minC = 0, maxC = maxCols - 1;

    if (selection.type === "range" || selection.type === "columnRange" || selection.type === "rowRange") {
        const bounds = RangeSelectionManage.normalizeSelection(selection);
        minR = bounds.minR;
        maxR = bounds.maxR;
        minC = bounds.minC;
        maxC = bounds.maxC;
    } else if (selection.type === "row") {
        minR = selection.startRowIdx!;
        maxR = selection.startRowIdx!;
    } else if (selection.type === "column") {
        minC = selection.startColIdx!;
        maxC = selection.startColIdx!;
    }

    let currentR = selection.activeRowIdx !== undefined ? selection.activeRowIdx : (selection.startRowIdx ?? minR);
    let currentC = selection.activeColIdx !== undefined ? selection.activeColIdx : (selection.startColIdx ?? minC);

    if (selection.type === "row") {
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
