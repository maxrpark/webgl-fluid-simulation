import FluidSimulation from "./FluidSimulation.js";
import { scaleByPixelRatio } from "./utils/helperFunc.js";
var Pointer = /** @class */ (function () {
    function Pointer() {
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
        this.fluidSimulation = new FluidSimulation();
        this.canvas = this.fluidSimulation.canvas.canvas;
    }
    Pointer.prototype.updatePointerMoveData = function (x, y) {
        var posX = scaleByPixelRatio(x);
        var posY = scaleByPixelRatio(y);
        this.prevTexcoordX = this.texcoordX;
        this.prevTexcoordY = this.texcoordY;
        this.texcoordX = posX / this.canvas.width;
        this.texcoordY = 1.0 - posY / this.canvas.height;
        this.deltaX = this.correctDeltaX(this.texcoordX - this.prevTexcoordX);
        this.deltaY = this.correctDeltaY(this.texcoordY - this.prevTexcoordY);
        this.moved = Math.abs(this.deltaX) > 0 || Math.abs(this.deltaY) > 0;
    };
    Pointer.prototype.setPointerDown = function () {
        this.down = true;
    };
    Pointer.prototype.onTouchStart = function (id, posX, posY) {
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
    };
    Pointer.prototype.correctDeltaX = function (delta) {
        var aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio < 1)
            delta *= aspectRatio;
        return delta;
    };
    Pointer.prototype.correctDeltaY = function (delta) {
        var aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1)
            delta /= aspectRatio;
        return delta;
    };
    return Pointer;
}());
export default Pointer;
