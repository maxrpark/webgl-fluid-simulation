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
var BlurShader = /** @class */ (function (_super) {
    __extends(BlurShader, _super);
    function BlurShader() {
        return _super.call(this, shaderType.FRAGMENT, "\n       precision mediump float;\n       precision mediump sampler2D;\n\n       varying vec2 vUv;\n       varying vec2 vL;\n       varying vec2 vR;\n       uniform sampler2D uTexture;\n\n       void main () {\n           vec4 sum = texture2D(uTexture, vUv) * 0.29411764;\n           sum += texture2D(uTexture, vL) * 0.35294117;\n           sum += texture2D(uTexture, vR) * 0.35294117;\n           gl_FragColor = sum;\n       }\n", null) || this;
    }
    return BlurShader;
}(ShaderCompiler));
export default BlurShader;
