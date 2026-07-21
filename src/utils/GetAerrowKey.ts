import { ConstantKeys } from "./Constants.js";

export function getMovementDelta(e: KeyboardEvent) 
{
    switch (e.key) {

        case ConstantKeys.ARROW_UP_KEY:
            return { rowDelta: -1, colDelta: 0 };

        case ConstantKeys.ARROW_DOWN_KEY:
            return { rowDelta: 1, colDelta: 0 };

        case ConstantKeys.ARROW_LEFT_KEY:
            return { rowDelta: 0, colDelta: -1 };

        case ConstantKeys.ARROW_RIGHT_KEY:
            return { rowDelta: 0, colDelta: 1 };

        case ConstantKeys.ENTER_KEY:
            return { rowDelta: 1, colDelta: 0 };
            
        default:
            return { rowDelta: 0, colDelta: 0 };
    }
}
