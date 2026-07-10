export function getMovementDelta(e: KeyboardEvent) 
{
    switch (e.key) {

        case "ArrowUp":
            return { rowDelta: -1, colDelta: 0 };

        case "ArrowDown":
            return { rowDelta: 1, colDelta: 0 };

        case "ArrowLeft":
            return { rowDelta: 0, colDelta: -1 };

        case "ArrowRight":
            return { rowDelta: 0, colDelta: 1 };

        case "Enter":
            return { rowDelta: 1, colDelta: 0 };
            
        default:
            return { rowDelta: 0, colDelta: 0 };
    }
}
