import FluidSimulation from "./FluidSimulation.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";

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
  color: { r: number; g: number; b: number };
  fluidSimulation: FluidSimulation;
  canvas: HTMLCanvasElement;
  constructor() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = { r: 30, g: 0, b: 300 };
    // this.color = [30, 0, 300];

    this.fluidSimulation = new FluidSimulation({});
    this.canvas = this.fluidSimulation.canvasClass.canvas;
  }
  updatePointerMoveData(x: number, y: number) {
    let posX = scaleByPixelRatio(x);
    let posY = scaleByPixelRatio(y);
    this.prevTexcoordX = this.texcoordX;
    this.prevTexcoordY = this.texcoordY;
    this.texcoordX = posX / this.canvas.width;
    this.texcoordY = 1.0 - posY / this.canvas.height;
    this.deltaX = this.correctDeltaX(this.texcoordX - this.prevTexcoordX);
    this.deltaY = this.correctDeltaY(this.texcoordY - this.prevTexcoordY);
    this.moved = Math.abs(this.deltaX) > 0 || Math.abs(this.deltaY) > 0;
  }

  setPointerDown() {
    this.down = true;
  }

  onTouchStart(id: number, x: number, y: number) {
    let posX = scaleByPixelRatio(x);
    let posY = scaleByPixelRatio(y);
    this.id = id;
    this.down = true;
    this.moved = false;
    this.texcoordX = posX / this.canvas.width;
    this.texcoordY = 1.0 - posY / this.canvas.height;
    this.prevTexcoordX = this.texcoordX;
    this.prevTexcoordY = this.texcoordY;
    this.deltaX = 0;
    this.deltaY = 0;
    // this.color = generateColor();
  }

  correctDeltaX(delta: number) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
  }

  correctDeltaY(delta: number) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
  }
}
