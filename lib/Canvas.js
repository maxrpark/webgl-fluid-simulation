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
    function Canvas(canvas) {
        var _this = _super.call(this) || this;
        _this.canvas = canvas;
        _this.resizeCanvas();
        _this.canvas.addEventListener("mousemove", function (e) {
            _this.trigger("mousemove", [e]);
        });
        _this.canvas.addEventListener("mouseup", function () {
            _this.trigger("mouseup");
        });
        _this.canvas.addEventListener("touchstart", function (e) {
            e.preventDefault();
            _this.trigger("touchstart");
        });
        _this.canvas.addEventListener("touchmove", function (e) {
            e.preventDefault();
            _this.trigger("touchmove");
        }, false);
        _this.canvas.addEventListener("touchend", function (e) {
            _this.trigger("touchend");
        });
        _this.canvas.addEventListener("keydown", function (e) {
            _this.trigger("keydown");
        });
        window.addEventListener("resize", function () {
            _this.resizeCanvas();
        });
        return _this;
    }
    Canvas.prototype.resizeCanvas = function () {
        var width = scaleByPixelRatio(this.canvas.clientWidth);
        var height = scaleByPixelRatio(this.canvas.clientHeight);
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.trigger("resize");
    };
    return Canvas;
}(EventEmitter));
export default Canvas;
