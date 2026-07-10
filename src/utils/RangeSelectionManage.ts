import type { SelectionState } from "../eventsHandler/InteractionHandler.js";

export class RangeSelectionManage 
{
    public static normalizeSelection(selection: SelectionState) 
    {
        const startR = selection.startRowIdx ?? 0;
        const endR = selection.endRowIdx ?? 0;
        const startC = selection.startColIdx ?? 0;
        const endC = selection.endColIdx ?? 0;

        return {
            minR: Math.min(startR, endR),
            maxR: Math.max(startR, endR),
            minC: Math.min(startC, endC),
            maxC: Math.max(startC, endC)
        };
    }
}