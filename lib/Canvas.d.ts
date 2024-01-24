import EventEmitter from "./utils/EventEmitter.js";
export default class Canvas extends EventEmitter {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    constructor(className: string, canvasContainer: string, isTexture: boolean);
    resizeCanvas(): void;
}
