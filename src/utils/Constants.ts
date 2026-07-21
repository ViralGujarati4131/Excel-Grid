export const CellMode = {
    OVERRIDE: 'override',
    APPEND: 'append'
}

export const ConstantKeys = {
    Z_KEY: 'z',
    Y_KEY: 'y',
    F2_KEY: 'F2',
    ESCAPE_KEY: 'Escape',
    ENTER_KEY: 'Enter',
    ARROW_KEY: 'Arrow',
    ARROW_UP_KEY: 'ArrowUp',
    ARROW_DOWN_KEY: 'ArrowDown',
    ARROW_LEFT_KEY: 'ArrowLeft',
    ARROW_RIGHT_KEY: 'ArrowRight',
    BACKSPACE_KEY: "Backspace",
    DELETE_KEY: "Delete"
}

export const RowAttributes = {
    DefaultHeight: 30,
    MaxRows: 1_00_000,
    Expand_50_Row: 50,
    EdgeMargin: 50,
    MinHeight: 15,
    CursorType: "row-resize",
    InitialRows: 100
}

export const ColumnAttributes = {
    DefaultWidth: 100,
    MaxColumns: 500,
    Expand_30_Column: 30,
    EdgeMargin: 80,
    MinWidth: 30,
    CursorType: "col-resize",
    InitialColumns: 60
}

export const Delays = {
    TwentyFiveMS: 25,
    FiftyMS: 50,
    HundreadMS: 100
}

export const HeaderAttributes = {
    Width: 50,
    Height: 30
}

export const RibbonHeight = 40

export const Trigger_Threshold = 300

export const DefaultCursorType = "default"

export const IsSelectRange = "isSelectingRange";

export const RowHoverInfoCheck = "rowHoverResizeInfo";
export const ColumnHoverInfoCheck = "columnHoverResizeInfo";

export const RowHoverCheck = "rowHoverResizeInfo";
export const ColumnHoverCheck = "columnHoverResizeInfo";

export const RowResizeCheck = "rowResizeState";
export const ColumnResizeCheck = "columnResizeState";