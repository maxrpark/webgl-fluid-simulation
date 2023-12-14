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
import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
var BaseVertexShader = /** @class */ (function (_super) {
    __extends(BaseVertexShader, _super);
    function BaseVertexShader() {
        return _super.call(this, shaderType.VERTEX, "\n     precision highp float;\n\n     attribute vec2 aPosition;\n     varying vec2 vUv;\n     varying vec2 vL;\n     varying vec2 vR;\n     varying vec2 vT;\n     varying vec2 vB;\n     uniform vec2 texelSize;\n\n     void main () {\n         vUv = aPosition * 0.5 + 0.5;\n         vL = vUv - vec2(texelSize.x, 0.0);\n         vR = vUv + vec2(texelSize.x, 0.0);\n         vT = vUv + vec2(0.0, texelSize.y);\n         vB = vUv - vec2(0.0, texelSize.y);\n         gl_Position = vec4(aPosition, 0.0, 1.0);\n     }\n", null) || this;
    }
    return BaseVertexShader;
}(ShaderCompiler));
export default BaseVertexShader;
