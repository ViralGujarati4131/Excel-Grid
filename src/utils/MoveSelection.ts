// import type { Workbook } from "../core/Workbook.js";
// import type { SelectionState } from "../events/InteractionHandler.js";
// import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
// import type { Viewport } from "../rendering/Viewport.js";
// import { adjustViewportToCell } from "./AdjustViewportToCell.js";
// import { updateView } from "./updateView.js";

// // selection set if selection change via  -> 
// export function moveSelection(rowDelta: number, colDelta: number,workbook: Workbook,selection: SelectionState | null,viewport: Viewport,renderer: CanvasRenderer,dragSelectionType: "cell" | "row" | "column"): void 
// {
//     // if nothing is selection return
//     if (!selection || selection.startRowIdx === undefined || selection.startColIdx === undefined) 
//         return;
    
//     // set new row column id
//     let newRowIdx = selection.startRowIdx + rowDelta;
//     let newColIdx = selection.startColIdx + colDelta;

//     // after move if it come near to end at scroll expand row
//     if (newRowIdx >= workbook.rows.length - 5) 
//     {
//         workbook.expandRows(50);
//     }
    
//     // after move if it come near to end at scroll expand column
//     if (newColIdx >= workbook.columns.length - 3) 
//     {
//         workbook.expandColumns(10);
//     }

//     // to handle minus index condition
//     newRowIdx = Math.max(0, Math.min(newRowIdx, workbook.rows.length - 1));
//     newColIdx = Math.max(0, Math.min(newColIdx, workbook.columns.length - 1));

//     // new row col of cell
//     const row = workbook.rows[newRowIdx];
//     const col = workbook.columns[newColIdx];

//     if (row && col) 
//     {
//         selection = {
//             type: "cell",
//             rowId: row.id,
//             colName: col.name,
//             startRowIdx: newRowIdx,
//             startColIdx: newColIdx,
//             endRowIdx: newRowIdx,
//             endColIdx: newColIdx
//         };

//         // make view port visible if cell selection go out of visible boundry
//         adjustViewportToCell(newRowIdx, newColIdx,renderer,workbook,viewport);
//         updateView(workbook,selection!,viewport,renderer,dragSelectionType);
//     }
// }