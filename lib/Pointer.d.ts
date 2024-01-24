export default class Pointer {
    id: number;
    texcoordX: number;
    texcoordY: number;
    prevTexcoordX: number;
    prevTexcoordY: number;
    deltaX: number;
    deltaY: number;
    down: boolean;
    moved: boolean;
    color: {
        r: number;
        g: number;
        b: number;
    };
    canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement);
    updatePointerMoveData(x: number, y: number): void;
    setPointerDown(): void;
    onTouchStart(id: number, x: number, y: number): void;
    correctDeltaX(delta: number): number;
    correctDeltaY(delta: number): number;
}
