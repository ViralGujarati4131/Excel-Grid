import type { Workbook } from "../core/Workbook.js";
import type { InteractionHandler } from "../events/InteractionHandler.js";
import type { Viewport } from "../rendering/Viewport.js";

export class FileUpload
{
    constructor(
        private workbook: Workbook,
        private viewport: Viewport,
        private domSpinner: HTMLElement | null
    )
    {}

    public handleJsonFileUpload(e: Event,handler: InteractionHandler): void 
    {
        const target = e.target as HTMLInputElement;
        const file = target.files ? target.files[0] : null;

        if (!file) 
            return;

        if (this.domSpinner) 
            this.domSpinner.style.display = "inline";

        const reader = new FileReader();

        reader.readAsText(file);

        reader.onload = (event) => 
        {
            try {
                const rawText = event.target?.result as string;
                const parsedData = JSON.parse(rawText);

                // to clear previous data
                this.workbook.clearAllCellsText();

                const headerName: string[] = [];    
                headerName.push("id")
                for(const header in parsedData[0])
                {
                    if(header !== "id")
                        headerName.push(header)
                }                
                
                const finalRecordSet: unknown[] = Array.isArray(parsedData) ? parsedData : [parsedData];                

                // add data into the cell 
                this.workbook.loadJsonRecordSet(finalRecordSet,headerName);
                
                this.viewport.scrollX = 0;
                this.viewport.scrollY = 0;
                
            } 
            catch (error) 
            {
                alert("Invalid JSON File Format. Please verify inner file arrays nodes keys structures layout.");
                console.error(error);
            } 
            finally 
            {
                if (this.domSpinner) 
                    this.domSpinner.style.display = "none";

                target.value = ""; 
                handler.updateView();
            }
        };
    }
}