import FluidSimulation from "../FluidSimulation.js";
import { shaderType } from "../ts/global.js";
var ShaderCompiler = /** @class */ (function () {
    function ShaderCompiler(type, sourceShader, keywords) {
        this.fluidSimulation = new FluidSimulation();
        this.gl = this.fluidSimulation.webGLContext.gl;
        var k = (keywords === null || keywords === void 0 ? void 0 : keywords.length)
            ? this.fluidSimulation.webGLContext.ext.supportLinearFiltering
                ? null
                : ["MANUAL_FILTERING"]
            : [];
        var source = this.addKeywords(sourceShader, k);
        this.shader = this.gl.createShader(type === shaderType.VERTEX
            ? this.gl.VERTEX_SHADER
            : this.gl.FRAGMENT_SHADER);
        if (!this.shader) {
            throw new Error();
        }
        this.gl.shaderSource(this.shader, source);
        this.gl.compileShader(this.shader);
        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS))
            console.trace(this.gl.getShaderInfoLog(this.shader));
    }
    ShaderCompiler.prototype.addKeywords = function (source, keywords) {
        if (keywords == null)
            return source;
        var keywordsString = "";
        keywords.forEach(function (keyword) {
            keywordsString += "#define " + keyword + "\n";
        });
        return keywordsString + source;
    };
    return ShaderCompiler;
}());
export default ShaderCompiler;
