import EventEmitter from "./utils/EventEmitter.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";

export default class Canvas extends EventEmitter {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  constructor(canvas: HTMLCanvasElement) {
    super();
    console.log(canvas);

    this.canvas = canvas;
    this.resizeCanvas();
    this.canvas.addEventListener("mousemove", (e) => {
      this.trigger("mousemove", [e]);
    });
    this.canvas.addEventListener("mousedown", (e) => {
      this.trigger("mousedown", [e]);
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.trigger("mouseup", [e]);
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.trigger("touchstart", [e]);
    });

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        this.trigger("touchmove", [e]);
      },
      false
    );

    this.canvas.addEventListener("touchend", (e) => {
      this.trigger("touchend", [e]);
    });

    this.canvas.addEventListener("keydown", (e) => {
      this.trigger("keydown", [e]);
    });

    window.addEventListener("resize", () => {
      this.resizeCanvas();
    });
  }

  resizeCanvas() {
    let width = scaleByPixelRatio(this.canvas.clientWidth);
    let height = scaleByPixelRatio(this.canvas.clientHeight);

    this.width = width;
    this.height = height;

    this.canvas.width = width;
    this.canvas.height = height;

    this.trigger("resize");
  }
}
