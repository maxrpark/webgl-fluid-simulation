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
var ColorShader = /** @class */ (function (_super) {
    __extends(ColorShader, _super);
    function ColorShader() {
        return _super.call(this, shaderType.FRAGMENT, "\n     precision mediump float;\n\n     uniform vec4 color;\n\n     void main () {\n         gl_FragColor = color;\n     }\n", null) || this;
    }
    return ColorShader;
}(ShaderCompiler));
export default ColorShader;
