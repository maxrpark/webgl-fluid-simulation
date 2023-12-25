var FramebufferObject = /** @class */ (function () {
    function FramebufferObject(props) {
        Object.assign(this, props);
    }
    FramebufferObject.prototype.attach = function (textureUnit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        return textureUnit;
    };
    return FramebufferObject;
}());
export { FramebufferObject };
