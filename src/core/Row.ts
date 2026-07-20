import { RowAttributes } from "../utils/Constants.js";

// row class which contain the row id and its height
export class Row 
{
    constructor(public readonly id: number, public height: number = RowAttributes.DefaultHeight) {}
}