var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import EventEmitter from "./utils/EventEmitter.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";
var Canvas = /** @class */ (function (_super) {
    __extends(Canvas, _super);
    // canvasContainer: string;
    function Canvas(className, canvasContainer, isTexture) {
        var _this = _super.call(this) || this;
        _this.canvas = document.createElement("canvas");
        if (canvasContainer) {
            var container = document.getElementById(canvasContainer);
            if (!container) {
                throw new Error("NO Element found");
            }
            container.appendChild(_this.canvas);
        }
        else {
            if (!className && !canvasContainer) {
                _this.canvas.style.position = "fixed";
                _this.canvas.style.top = "0px";
                _this.canvas.style.pointerEvents = "auto";
                _this.canvas.style.zIndex = "-1";
            }
            document.body.appendChild(_this.canvas);
        }
        if (!className) {
            _this.canvas.style.width = "100%";
            _this.canvas.style.height = "100vh";
        }
        else {
            _this.canvas.classList.add(className);
        }
        if (isTexture) {
            // this.canvas.style.visibility = "hidden";
            var overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0px";
            overlay.style.pointerEvents = "auto";
            overlay.style.zIndex = "-9999";
            overlay.style.width = "100%";
            overlay.style.height = "100vh";
            overlay.style.background = "white";
            document.body.appendChild(overlay);
            _this.canvas.style.zIndex = "-10000";
            _this.canvas.style.position = "fixed";
        }
        _this.resizeCanvas();
        window.addEventListener("mousemove", function (e) {
            _this.trigger("mousemove", [e]);
        });
        window.addEventListener("mousedown", function (e) {
            _this.trigger("mousedown", [e]);
        });
        window.addEventListener("mouseup", function (e) {
            _this.trigger("mouseup", [e]);
        });
        window.addEventListener("touchstart", function (e) {
            // e.preventDefault();
            _this.trigger("touchstart", [e]);
        });
        window.addEventListener("touchmove", function (e) {
            // e.preventDefault();
            _this.trigger("touchmove", [e]);
        }, false);
        window.addEventListener("touchend", function (e) {
            _this.trigger("touchend", [e]);
        });
        window.addEventListener("keydown", function (e) {
            _this.trigger("keydown", [e]);
        });
        window.addEventListener("resize", function () {
            _this.resizeCanvas();
        });
        return _this;
    }
    Canvas.prototype.resizeCanvas = function () {
        this.width = scaleByPixelRatio(this.canvas.clientWidth);
        this.height = scaleByPixelRatio(this.canvas.clientHeight);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.trigger("resize");
    };
    return Canvas;
}(EventEmitter));
export default Canvas;
