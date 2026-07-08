// import type { Workbook } from "../core/Workbook.js";
// import type { SelectionState } from "../events/InteractionHandler.js";
// import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
// import type { Viewport } from "../rendering/Viewport.js";
// import { adjustViewportToCell } from "./AdjustViewportToCell.js";
// import { updateView } from "./updateView.js";

// export function rangeSelectionUsingKey(rowDelta: number, colDelta: number,workbook: Workbook,selection: SelectionState | null,viewport: Viewport,renderer: CanvasRenderer,dragSelectionType: "cell" | "row" | "column"): void 
// {
//     if (!selection || selection.startRowIdx === undefined || selection.startColIdx === undefined || selection.endRowIdx === undefined || selection.endColIdx === undefined) 
//         return;

//     let newEndRowIdx = selection.endRowIdx + rowDelta;
//     let newEndColIdx = selection.endColIdx + colDelta;

//     // if near to end row or column expand row and column
//     if (newEndRowIdx >= workbook.rows.length - 5) 
//         workbook.expandRows(50);

//     if (newEndColIdx >= workbook.columns.length - 3) 
//         workbook.expandColumns(10);

//     // handle the minus case 
//     newEndRowIdx = Math.max(0, Math.min(newEndRowIdx, workbook.rows.length - 1));
//     newEndColIdx = Math.max(0, Math.min(newEndColIdx, workbook.columns.length - 1));

//     selection.endRowIdx = newEndRowIdx;
//     selection.endColIdx = newEndColIdx;

//     if (selection.startRowIdx === selection.endRowIdx && selection.startColIdx === selection.endColIdx) 
//     {
//         selection.type = "cell";
//     } 
//     else 
//     {
//         selection.type = "range";  
//     }

//     adjustViewportToCell(newEndRowIdx, newEndColIdx,renderer,workbook,viewport);
//     updateView(workbook,selection!,viewport,renderer,dragSelectionType);
// }