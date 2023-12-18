import FluidSimulation from "./FluidSimulation.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";
var Program = /** @class */ (function () {
    function Program(_a) {
        var fragmentShader = _a.fragmentShader, vertexShader = _a.vertexShader;
        this.fluidSimulation = new FluidSimulation();
        this.gl = this.fluidSimulation.webGLContext.gl;
        this.vertexShader = vertexShader
            ? vertexShader
            : new BaseVertexShader().shader;
        this.uniforms = {
            uTexture: null,
            texelSize: null,
            uVelocity: null,
        };
        this.program = this.createProgram(this.vertexShader, fragmentShader);
        this.uniforms = this.getUniforms(this.program); // TODO
    }
    Program.prototype.bind = function () {
        this.gl.useProgram(this.program);
    };
    Program.prototype.createProgram = function (vertexShader, fragmentShader) {
        var program = this.gl.createProgram(); // TODO
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
            console.trace(this.gl.getProgramInfoLog(program));
        return program;
    };
    Program.prototype.getUniforms = function (program) {
        var uniforms = []; // TODO
        var uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < uniformCount; i++) {
            var uniformName = this.gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    };
    return Program;
}());
export default Program;
