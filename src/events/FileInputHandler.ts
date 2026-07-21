import type { FileUpload } from "../functionality/FileUpload.js";
import type { InteractionHandler } from "./InteractionHandler.js";

export class FileInputHandler 
{
    constructor(
        private fileUpload: FileUpload
    ) {}

    // read the data of json file and store it in cells and update view 
    public handleFileImport(e: Event,handler: InteractionHandler): void 
    {
        this.fileUpload.handleJsonFileUpload(e,handler);
    }
}