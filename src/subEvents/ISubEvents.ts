import type { InteractionHandler } from "../events/InteractionHandler.js";

export interface ISubEvents {

    hitCheck(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): boolean;

    onPointerDown(e: PointerEvent, x: number, y: number, indices: { rowIdx: number; colIdx: number } | null, handler: InteractionHandler): void;

    onPointerMove(e: PointerEvent, x: number, y: number, handler: InteractionHandler, width: number, height: number): void;

    onPointerUp(e: PointerEvent, handler: InteractionHandler): void;
}