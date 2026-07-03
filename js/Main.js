window.onload = function () {
    const canvas = document.getElementById("gridCanvas");
    const editor = document.getElementById("cellEditor");

    const grid = new Grid(canvas, editor, 100, 60);
    grid.draw();
};
