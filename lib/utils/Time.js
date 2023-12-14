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
import EventEmitter from "./EventEmitter.js";
var Time = /** @class */ (function (_super) {
    __extends(Time, _super);
    function Time() {
        var _this = _super.call(this) || this;
        _this.start = Date.now();
        _this.lastUpdateTime = _this.start;
        _this.current = _this.start;
        _this.delta = (_this.current - _this.lastUpdateTime) / 1000;
        _this.elapsed = 0;
        _this.tick();
        return _this;
    }
    Time.prototype.calcDeltaTime = function () {
        this.current = Date.now();
        this.delta = (this.current - this.lastUpdateTime) / 1000;
        this.delta = Math.min(this.delta, 0.016666);
        this.lastUpdateTime = this.current;
    };
    Time.prototype.tick = function () {
        var _this = this;
        this.calcDeltaTime();
        this.trigger("tick");
        window.requestAnimationFrame(function () { return _this.tick(); });
    };
    return Time;
}(EventEmitter));
export default Time;
