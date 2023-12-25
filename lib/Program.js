import CreateProgram from "./shaders/CreateProgram.js";
var Program = /** @class */ (function () {
    function Program(props) {
        Object.assign(this, props);
        this.gl = this.webGLContext.gl;
        this.uniforms = {
            texelSize: null,
            uTexture: null,
            uVelocity: null,
            uTarget: null,
            aspectRatio: null,
            point: null,
            radius: null,
            curve: null,
            threshold: null,
            intensity: null,
            uBloom: null,
            uDithering: null,
            ditherScale: null,
            uSunrays: null,
            color: null,
            weight: null,
            uCurl: null,
            curl: null,
            dt: null,
            value: null,
            uDivergence: null,
            uPressure: null,
            dyeTexelSize: null,
            uSource: null,
            dissipation: null,
        };
        var newProgram = new CreateProgram({
            webGLContext: this.webGLContext,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
        });
        this.program = newProgram.instance;
        this.uniforms = newProgram.uniforms; // TODO
    }
    Program.prototype.bind = function () {
        this.gl.useProgram(this.program);
    };
    return Program;
}());
export default Program;
