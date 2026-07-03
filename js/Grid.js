class Grid {
    constructor(canvas, editor, rowsCount, colsCount) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.editor = editor;
        this.headerHeight = 30;
        this.headerWidth = 50;
        this.scrollX = 0;
        this.scrollY = 0;
        this.selectedCell = null;

        // Create rows
        this.rows = [];
        for (let r = 1; r <= rowsCount; r++) {
            this.rows.push(new Row(r, 30));
        }

        // Create columns
        this.columns = [];
        for (let c = 0; c < colsCount; c++) {
            this.columns.push(new Column(this.colToName(c), 100));
        }

        // Create cells
        this.cells = new Map();
        for (let r of this.rows) {
            for (let c of this.columns) {
                let cell = new Cell(r, c);
                this.cells.set(cell.id, cell);
            }
        }

        this.lastClickTime = 0;
        this.attachEvents();
        this.resizeCanvas();
    }

    colToName(colIndex) {
        let name = "";
        colIndex++;
        while (colIndex > 0) {
            let rem = (colIndex - 1) % 26;
            name = String.fromCharCode(65 + rem) + name;
            colIndex = Math.floor((colIndex - 1) / 26);
        }
        return name;
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.textBaseline = "middle";

        const startCol = Math.floor(this.scrollX / 100);
        const startRow = Math.floor(this.scrollY / 30);
        const endCol = Math.min(this.columns.length, startCol + Math.ceil(this.canvas.width / 100) + 1);
        const endRow = Math.min(this.rows.length, startRow + Math.ceil(this.canvas.height / 30) + 1);

        // Column headers
        for (let c = startCol; c < endCol; c++) {
            let col = this.columns[c];
            let x = this.headerWidth + c * col.width - this.scrollX;
            ctx.fillStyle = "#eee";
            ctx.fillRect(x, 0, col.width, this.headerHeight);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x, 0, col.width, this.headerHeight);
            ctx.fillStyle = "#000";
            ctx.textAlign = "center";
            ctx.fillText(col.id, x + col.width / 2, this.headerHeight / 2);
        }

        // Row headers
        for (let r = startRow; r < endRow; r++) {
            let row = this.rows[r];
            let y = this.headerHeight + r * row.height - this.scrollY;
            ctx.fillStyle = "#eee";
            ctx.fillRect(0, y, this.headerWidth, row.height);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(0, y, this.headerWidth, row.height);
            ctx.fillStyle = "#000";
            ctx.textAlign = "center";
            ctx.fillText(row.id, this.headerWidth / 2, y + row.height / 2);
        }

        // Cells
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                let row = this.rows[r];
                let col = this.columns[c];
                let cell = this.cells.get(`R${row.id}C${col.id}`);

                let x = this.headerWidth + c * col.width - this.scrollX;
                let y = this.headerHeight + r * row.height - this.scrollY;

                ctx.fillStyle = cell.style.backgroundColor;
                ctx.fillRect(x, y, col.width, row.height);
                ctx.strokeStyle = "#ccc";
                ctx.strokeRect(x, y, col.width, row.height);

                ctx.fillStyle = cell.style.textColor;
                ctx.font = cell.style.font;
                ctx.textAlign = cell.style.align;
                ctx.fillText(cell.text, x + 2, y + row.height / 2);

                if (this.selectedCell &&
                    this.selectedCell.row.id === row.id &&
                    this.selectedCell.column.id === col.id) 
                {
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, col.width, row.height);
                    ctx.lineWidth = 1;
                }
            }
        }
    }

    getCellFromMouse(x, y) {
        if (x < this.headerWidth || y < this.headerHeight) return null;

        const colIndex = Math.floor((x + this.scrollX - this.headerWidth) / 100);
        const rowIndex = Math.floor((y + this.scrollY - this.headerHeight) / 30);

        if (rowIndex >= 0 && rowIndex < this.rows.length &&
            colIndex >= 0 && colIndex < this.columns.length) {
            return {
                row: this.rows[rowIndex],
                col: this.columns[colIndex]
            };
        }
        return null;
    }


    startEditing(cellInfo, mode = "override") {
        const rect = this.canvas.getBoundingClientRect();
        const colIndex = this.columns.indexOf(cellInfo.col);
        const rowIndex = this.rows.indexOf(cellInfo.row);

        const cellX = this.headerWidth + colIndex * cellInfo.col.width - this.scrollX;
        const cellY = this.headerHeight + rowIndex * cellInfo.row.height - this.scrollY;

        this.selectedCell = this.cells.get(`R${cellInfo.row.id}C${cellInfo.col.id}`);

        this.editor.style.left = rect.left + cellX + "px";
        this.editor.style.top = rect.top + cellY + "px";
        this.editor.style.width = cellInfo.col.width + "px";
        this.editor.style.height = cellInfo.row.height + "px";

        if (mode === "override") {
            this.editor.value = ""; // start fresh
        } else {
            this.editor.value = this.selectedCell.text; // keep old text
            this.editor.setSelectionRange(this.editor.value.length, this.editor.value.length); // cursor at end
        }

        this.editor.style.display = "block";
        this.editor.focus();
    }

    
    attachEvents() {
        window.addEventListener("resize", () => this.resizeCanvas());

        // Click to select
        this.canvas.addEventListener("click", (e) => {
            const now = Date.now();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellInfo = this.getCellFromMouse(x, y);

            if (cellInfo) {
                this.selectedCell = this.cells.get(`R${cellInfo.row.id}C${cellInfo.col.id}`);
                this.editor.style.display = "none";
                this.draw();
            }
            this.lastClickTime = now;
        });

        // Double click to append edit
        this.canvas.addEventListener("dblclick", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellInfo = this.getCellFromMouse(x, y);

            if (cellInfo) {
                if (this.selectedCell && this.selectedCell.text) {
                    this.startEditing(cellInfo, "append"); // continue from old text
                } else {
                    this.startEditing(cellInfo, "override"); // start fresh
                }
            }
        });

        // Typing directly after selecting a cell
        window.addEventListener("keydown", (e) => {
            if (this.selectedCell && this.editor.style.display === "none") {
                console.log(e.key);
                
                // Ignore control keys
                if (e.key.length === 1) {
                    const cellInfo = {
                        row: this.rows.find(r => r.id === this.selectedCell.row.id),
                        col: this.columns.find(c => c.id === this.selectedCell.column.id)
                    };
                    this.startEditing(cellInfo, "override");
                    this.editor.value = e.key; // start with typed character
                    e.preventDefault();
                }
            }
        });

        // Save on blur
        this.editor.addEventListener("blur", () => {
            if (this.selectedCell) {
                this.selectedCell.text = this.editor.value;
            }
            this.editor.style.display = "none";
            this.draw();
        });

        // Save on Enter
        this.editor.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.editor.blur();
            }
        });

        // Scroll
        this.canvas.addEventListener("wheel", (e) => {
            this.scrollX += e.deltaX;
            this.scrollY += e.deltaY;

            this.scrollX = Math.max(0, Math.min(
                this.scrollX,
                this.columns.length * 100 - (this.canvas.width - this.headerWidth)
            ));
            this.scrollY = Math.max(0, Math.min(
                this.scrollY,
                this.rows.length * 30 - (this.canvas.height - this.headerHeight)
            ));

            this.draw();
            e.preventDefault();
        }, { passive: false });
    }
}