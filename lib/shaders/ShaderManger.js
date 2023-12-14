import FluidSimulation from "../FluidSimulation";
var ShaderManager = /** @class */ (function () {
    function ShaderManager() {
        this.fluidSimulation = new FluidSimulation();
        this.gl = this.fluidSimulation.webGLContext.gl;
    }
    ShaderManager.prototype.compileShader = function () {
        var source = this.addKeywords(sourceShader, keywords);
        this.shader = this.gl.createShader(type);
        if (!this.shader) {
            throw new Error();
        }
        this.gl.shaderSource(this.shader, source);
        this.gl.compileShader(this.shader);
        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS))
            console.trace(this.gl.getShaderInfoLog(this.shader));
    };
    ShaderManager.prototype.addKeywords = function (source, keywords) {
        if (keywords == null)
            return source;
        var keywordsString = "";
        keywords.forEach(function (keyword) {
            keywordsString += "#define " + keyword + "\n";
        });
        return keywordsString + source;
    };
    return ShaderManager;
}());
export default ShaderManager;
