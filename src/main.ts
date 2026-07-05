import { Workbook } from "./core/Workbook.js";
import { Viewport } from "./rendering/Viewport.js";
import { CanvasRenderer } from "./rendering/CanvasRenderer.js";
import { CellEditor } from "./components/CellEditor.js";
import { InteractionHandler } from "./events/InteractionHandler.js";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;
    const editorInput = document.getElementById("cellEditor") as HTMLInputElement;

    if (!canvas || !editorInput) {
        throw new Error("Required DOM Elements are missing.");
    }

    const workbook = new Workbook(100, 60);
    const viewport = new Viewport();
    const renderer = new CanvasRenderer(canvas);
    const editor = new CellEditor(editorInput);

    new InteractionHandler(workbook, viewport, renderer, editor);

    renderer.resize(window.innerWidth, window.innerHeight);
    renderer.render(workbook, viewport, null);
});