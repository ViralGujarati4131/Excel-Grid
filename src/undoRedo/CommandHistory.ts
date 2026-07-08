import type { ICommand } from "./ICommand.js";

export class CommandHistory 
{
    private undoStack: ICommand[] = [];
    private redoStack: ICommand[] = [];

    public add(command: ICommand): void 
    {
        this.undoStack.push(command);
        this.redoStack = []; 
    }

    public undo(): boolean 
    {
        const command = this.undoStack.pop();

        if (!command) 
            return false;
        
        command.undo();
        this.redoStack.push(command);
        return true;
    }

    public redo(): boolean 
    {
        const command = this.redoStack.pop();

        if (!command) 
            return false;
        
        command.execute();
        this.undoStack.push(command);
        return true;
    }
}