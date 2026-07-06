// column class which contain the column index, name, width
export class Column 
{
    constructor(public readonly index: number, public readonly name: string, public width: number = 100) {}
}