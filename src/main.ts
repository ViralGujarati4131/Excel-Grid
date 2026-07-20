import { Workbook } from "./core/Workbook.js";
import { Viewport } from "./rendering/Viewport.js";
import { CanvasRenderer } from "./rendering/CanvasRenderer.js";
import { CellEditor } from "./components/CellEditor.js";
import { InteractionHandler } from "./eventsHandler/InteractionHandler.js";
import { ColumnAttributes, RibbonHeight, RowAttributes } from "./utils/Constants.js";

window.addEventListener("DOMContentLoaded", () => 
{
    const canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;
    const editorInput = document.getElementById("cellEditor") as HTMLInputElement;

    if (!canvas || !editorInput) 
    {
        throw new Error("Required DOM Elements are missing.");
    }

    // create the initial stage row, column and cells
    const workbook = new Workbook(RowAttributes.InitialRows, ColumnAttributes.InitialColumns);

    // set the scrollX, scrollY value at initial
    const viewport = new Viewport();

    // this the class where the header for row, column and cells or selection cell all things are set
    const renderer = new CanvasRenderer(canvas);

    // this used when we want to show the input box on cell, also for hide it at initial stage 
    // and get set the val of that perticular cell
    const editor = new CellEditor(editorInput);

    // here we add the core functionality of grid
    new InteractionHandler(workbook, viewport, renderer, editor);

    // resize use to set the rendering size according to the size of window
    renderer.resize(window.innerWidth, window.innerHeight - RibbonHeight);

    // this will render the entire grid
    renderer.render(workbook, viewport, null);
});