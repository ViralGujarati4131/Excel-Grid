class Cell {
    constructor(row, column, text = "", style = {}) {
        this.row = row;        
        this.column = column;   
        this.id = `R${row.id}C${column.id}`;
        this.text = text;
        this.style = Object.assign({
            font: "14px Arial",
            textColor: "#000",
            backgroundColor: "#fff",
            align: "left"
        }, style);
    }
}
