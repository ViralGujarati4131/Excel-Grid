// import type { Workbook } from "../core/Workbook.js";
// import type { SelectionState } from "../events/InteractionHandler.js";
// import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
// import type { Viewport } from "../rendering/Viewport.js";
// import { adjustViewportToCell } from "./AdjustViewportToCell.js";
// import { updateView } from "./updateView.js";

// // jump to end to data boundry via ctrl + -> 
// export function jumpToDataBoundary(rowDelta: number, colDelta: number,workbook: Workbook,selection: SelectionState,viewport: Viewport,renderer: CanvasRenderer,dragSelectionType: "cell" | "row" | "column"): void 
// {
//     if (!selection || selection.startRowIdx === undefined || selection.startColIdx === undefined) 
//         return;

//     let currentR = selection.startRowIdx;
//     let currentC = selection.startColIdx;

//     const checkCellFilled = (rIdx: number, cIdx: number): boolean => 
//     {
//         const row = workbook.rows[rIdx];
//         const col = workbook.columns[cIdx];

//         if (!row || !col) 
//             return false;

//         const cell = workbook.getCell(row.id, col.name);

//         return Boolean(cell && cell.text.trim().length > 0);
//     };

//     let firstNextR = currentR + rowDelta;
//     let firstNextC = currentC + colDelta;

//     // if it goes to out of boundry return it
//     if (firstNextR < 0 || firstNextR >= workbook.rows.length || firstNextC < 0 || firstNextC >= workbook.columns.length)
//         return;

//     const isCurrentFilled = checkCellFilled(currentR, currentC);
//     const isNextFilled = checkCellFilled(firstNextR, firstNextC);

//     let lookForFilled: boolean;
    
//     if (isCurrentFilled && !isNextFilled) 
//     {
//         // if current is filled and next is not filled
//         currentR = firstNextR;
//         currentC = firstNextC;

//         // cuurent is filled and next is not so we need to continue to find end bound
//         lookForFilled = true; 
//     } 
//     else if (isCurrentFilled && isNextFilled) 
//     {
//         //  if current and next both are filled

//         // next is also filled so need to find end bound
//         lookForFilled = false; 
//     } 
//     else 
//     {
//         // if current is not filled

//         // look for end bound
//         lookForFilled = true; 
//     }

//     while (true) 
//     {
//         let nextR = currentR + rowDelta;
//         let nextC = currentC + colDelta;

//         // check until the current limits of workbook
//         if (nextR < 0 || nextR >= workbook.rows.length || nextC < 0 || nextC >= workbook.columns.length) 
//             break;

//         const nextFilled = checkCellFilled(nextR, nextC);

//         if (lookForFilled) 
//         {
//             if (nextFilled) 
//             {
//                 currentR = nextR;
//                 currentC = nextC;
//                 break;
//             }
//         } 
//         else 
//         {
//             if (!nextFilled) 
//             {
//                 break;
//             }
//         }

//         currentR = nextR;
//         currentC = nextC;

//         if (rowDelta !== 0 && (currentR === 0 || currentR === workbook.rows.length - 1)) 
//             break;
        
//         if (colDelta !== 0 && (currentC === 0 || currentC === workbook.columns.length - 1)) 
//             break;
//     }

//     // apply selection to next filled or last cell in row or column
//     const targetRow = workbook.rows[currentR];
//     const targetCol = workbook.columns[currentC];

//     if (targetRow && targetCol) 
//     {
//         selection = {
//             type: "cell",
//             rowId: targetRow.id,
//             colName: targetCol.name,
//             startRowIdx: currentR,
//             startColIdx: currentC,
//             endRowIdx: currentR,
//             endColIdx: currentC
//         };
//         adjustViewportToCell(currentR, currentC,renderer,workbook,viewport);
//         updateView(workbook,selection!,viewport,renderer,dragSelectionType);
//     }
// }
