import BaseVertexShader from "./vertex/baseVertexShader.js";
var CreateProgram = /** @class */ (function () {
    function CreateProgram(_a) {
        var gl = _a.gl, vertexShader = _a.vertexShader, fragmentShader = _a.fragmentShader;
        this.gl = gl;
        this.vertexShader = vertexShader
            ? vertexShader
            : new BaseVertexShader().shader;
        this.createProgram(this.vertexShader, fragmentShader);
        this.getUniforms(this.instance);
    }
    CreateProgram.prototype.createProgram = function (vertexShader, fragmentShader) {
        var program = this.gl.createProgram(); // TODO
        this.gl.attachShader(program, this.vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
            console.trace(this.gl.getProgramInfoLog(program));
        this.instance = program;
    };
    CreateProgram.prototype.getUniforms = function (program) {
        var uniforms = []; // TODO
        var uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < uniformCount; i++) {
            var uniformName = this.gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
        }
        this.uniforms = uniforms;
    };
    return CreateProgram;
}());
export default CreateProgram;
