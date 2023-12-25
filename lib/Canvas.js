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
    function Canvas(className, canvasContainer) {
        var _this = _super.call(this) || this;
        // this.canvasContainer = canvasContainer;
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
                _this.canvas.style.inset = "0 0 0 0";
            }
            document.body.appendChild(_this.canvas);
        }
        if (!className) {
            _this.canvas.style.width = "100%";
            _this.canvas.style.height = "100%";
        }
        else {
            _this.canvas.classList.add(className);
        }
        _this.resizeCanvas();
        _this.canvas.addEventListener("mousemove", function (e) {
            _this.trigger("mousemove", [e]);
        });
        _this.canvas.addEventListener("mousedown", function (e) {
            _this.trigger("mousedown", [e]);
        });
        _this.canvas.addEventListener("mouseup", function (e) {
            _this.trigger("mouseup", [e]);
        });
        _this.canvas.addEventListener("touchstart", function (e) {
            e.preventDefault();
            _this.trigger("touchstart", [e]);
        });
        _this.canvas.addEventListener("touchmove", function (e) {
            e.preventDefault();
            _this.trigger("touchmove", [e]);
        }, false);
        _this.canvas.addEventListener("touchend", function (e) {
            _this.trigger("touchend", [e]);
        });
        _this.canvas.addEventListener("keydown", function (e) {
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
