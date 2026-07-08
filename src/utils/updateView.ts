// import type { Workbook } from "../core/Workbook.js";
// import type { SelectionState } from "../events/InteractionHandler.js";
// import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
// import type { Viewport } from "../rendering/Viewport.js";
// import { updateRibbonMetrics } from "./UpdateRibbonMetrices.js";

// export function updateView(workbook: Workbook,selection: SelectionState | null,viewport: Viewport,renderer: CanvasRenderer,dragSelectionType: "cell" | "row" | "column"): void {

//     // if multiple entire row or column selected than if expantion happen to maintain that
//     // row and column selected
//     if (selection) 
//     {
//         if (selection.type === "column" || (selection.type === "range" && dragSelectionType === "column")) 
//         {
//             selection.endRowIdx = workbook.rows.length - 1;
//         } 
//         else if (selection.type === "row" || (selection.type === "range" && dragSelectionType === "row")) 
//         {
//             selection.endColIdx = workbook.columns.length - 1;
//         }   
//     }

//     updateRibbonMetrics(selection,workbook);

//     renderer.render(workbook, viewport, selection);
// }