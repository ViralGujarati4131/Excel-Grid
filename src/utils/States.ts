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

export interface RowState 
{
    type: "cell" | "row" | "column" | "range" | "rowRange" | "columnRange";
    rowId: number | null;
    colName: string | null;
    startRowIdx?: number;
    startColIdx?: number;
    endRowIdx?: number;
    endColIdx?: number;
    activeRowIdx?: number;
    activeColIdx?: number;
}