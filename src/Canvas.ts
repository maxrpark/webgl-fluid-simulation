import EventEmitter from "./utils/EventEmitter.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";

export default class Canvas extends EventEmitter {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;

  // canvasContainer: string;
  constructor(className: string, canvasContainer: string, isTexture: boolean) {
    super();
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
        this.canvas.style.top = "0px";
        this.canvas.style.pointerEvents = "auto";
        this.canvas.style.zIndex = "-1";
      }
      document.body.appendChild(this.canvas);
    }

    if (!className) {
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100vh";
    } else {
      this.canvas.classList.add(className);
    }
    if (isTexture) {
      // this.canvas.style.visibility = "hidden";
      const overlay = document.createElement("div");

      overlay.style.position = "fixed";
      overlay.style.top = "0px";
      overlay.style.pointerEvents = "auto";
      overlay.style.zIndex = "-9999";
      overlay.style.width = "100%";
      overlay.style.height = "100vh";
      overlay.style.background = "white";

      document.body.appendChild(overlay);
      this.canvas.style.zIndex = "-10000";
      this.canvas.style.position = "fixed";
    }

    this.resizeCanvas();
    window.addEventListener("mousemove", (e) => {
      this.trigger("mousemove", [e]);
    });
    window.addEventListener("mousedown", (e) => {
      this.trigger("mousedown", [e]);
    });

    window.addEventListener("mouseup", (e) => {
      this.trigger("mouseup", [e]);
    });

    window.addEventListener("touchstart", (e) => {
      // e.preventDefault();
      this.trigger("touchstart", [e]);
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        // e.preventDefault();

        this.trigger("touchmove", [e]);
      },
      false
    );

    window.addEventListener("touchend", (e) => {
      this.trigger("touchend", [e]);
    });

    window.addEventListener("keydown", (e) => {
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
