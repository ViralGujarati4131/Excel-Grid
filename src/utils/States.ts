export interface RowHoverResizeInfo
{ 
    index: number;
}

export interface ColumnHoverResizeInfo
{ 
    index: number;
}

export interface RowResizeState 
{
    index: number;
    startPos: number;
    startSize: number;
}

export interface ColumnResizeState 
{
    index: number;
    startPos: number;
    startSize: number;
}

export interface SelectionState 
{
    startRowIdx?: number;
    startColIdx?: number;
    endRowIdx?: number;
    endColIdx?: number;
    activeRowIdx?: number;
    activeColIdx?: number;
}