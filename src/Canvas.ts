import EventEmitter from "./utils/EventEmitter.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";

export default class Canvas extends EventEmitter {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;

  // canvasContainer: string;
  constructor(className: string, canvasContainer: string) {
    super();
    // this.canvasContainer = canvasContainer;
    this.canvas = document.createElement("canvas");
    if (canvasContainer) {
      const container = document.getElementById(canvasContainer);

      if (!container) {
        throw new Error("NO Element found");
      }
      container.appendChild(this.canvas);
    } else {
      if (!className && !canvasContainer) {
        this.canvas.style.position = "fixed";
        this.canvas.style.inset = "0 0 0 0";
      }
      document.body.appendChild(this.canvas);
    }

    if (!className) {
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
    } else {
      this.canvas.classList.add(className);
    }

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
    this.width = scaleByPixelRatio(this.canvas.clientWidth);
    this.height = scaleByPixelRatio(this.canvas.clientHeight);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.trigger("resize");
  }
}
