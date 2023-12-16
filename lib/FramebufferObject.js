import FluidSimulation from "./FluidSimulation.js";
var FramebufferObject = /** @class */ (function () {
    function FramebufferObject(props) {
        Object.assign(this, props);
        this.fluidSimulation = new FluidSimulation();
    }
    FramebufferObject.prototype.attach = function (textureUnit) {
        var gl = this.fluidSimulation.webGLContext.gl;
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return textureUnit;
    };
    return FramebufferObject;
}());
export { FramebufferObject };
