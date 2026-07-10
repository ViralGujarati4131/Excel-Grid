import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../eventsHandler/InteractionHandler.js";
import type { CanvasRenderer } from "../rendering/CanvasRenderer.js";
import type { Viewport } from "../rendering/Viewport.js";

export class CanvasScroll
{
    constructor(
        private viewport: Viewport,
        private workbook: Workbook,
        private renderer:  CanvasRenderer,
        private updateView: () => void
    ){}

    public handleCanvasScroll(e: WheelEvent,handler: InteractionHandler): void 
    {
        this.viewport.scrollX += e.deltaX;
        this.viewport.scrollY += e.deltaY;

        let currentWorkbookWidth = 0;
        for (const col of this.workbook.columns) 
            currentWorkbookWidth += col.width;

        let currentWorkbookHeight = 0;
        for (const row of this.workbook.rows) 
            currentWorkbookHeight += row.height;

        const canvasElement = this.renderer.getCanvasElement();
        const triggerThresholdPixels = 300;

         // add the row dynamically when near to reach at end of the scroll
        if ((this.viewport.scrollY + canvasElement.height) > (currentWorkbookHeight - triggerThresholdPixels)) 
        {
            this.workbook.expandRows(100);
            currentWorkbookHeight = 0;

            for (const row of this.workbook.rows) 
                currentWorkbookHeight += row.height;
        }

         // add the column dynamically when near to reach at end of the scroll
        if ((this.viewport.scrollX + canvasElement.width) > (currentWorkbookWidth - triggerThresholdPixels)) 
        {
            this.workbook.expandColumns(30);
            currentWorkbookWidth = 0;

            for (const col of this.workbook.columns) 
                currentWorkbookWidth += col.width;
        }
        this.viewport.clamp(currentWorkbookWidth, currentWorkbookHeight, canvasElement.width, canvasElement.height);
        (handler as any).updateView();
        e.preventDefault();
    }
    
}