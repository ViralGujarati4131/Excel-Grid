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

export interface CellSelectionState
{
    rowId: number | null;
    colName: string | null;
    startRowIdx: number;
    startColIdx: number;
    endRowIdx: number;
    endColIdx: number;
    activeRowIdx: number;
    activeColIdx: number;
}

export interface RowSelectionState 
{
    rowId: number | null;
    startRowIdx: number;
    startColIdx: number;
    endRowIdx: number;
    endColIdx: number;
    activeRowIdx: number;
    activeColIdx: number;
}

export interface ColumnSelectionState 
{
    colName: string | null;
    startRowIdx: number;
    startColIdx: number;
    endRowIdx: number;
    endColIdx: number;
    activeRowIdx: number;
    activeColIdx: number;
}
