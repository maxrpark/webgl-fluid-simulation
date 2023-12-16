var WebGLContext = /** @class */ (function () {
    function WebGLContext(canvas) {
        this.getWebGLContext(canvas);
    }
    WebGLContext.prototype.getWebGLContext = function (canvas) {
        var params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error("The element of id \"TODO\" is not a HTMLCanvasElement. Make sure a <canvas id=\"TODO\"\"> element is present in the document."); // ERROR
        }
        this.gl = canvas.getContext("webgl2", params);
        var isWebGL2 = !!this.gl; // TODO
        if (!this.gl)
            this.gl =
                canvas.getContext("webgl", params) ||
                    canvas.getContext("experimental-webgl", params);
        var halfFloat;
        var supportLinearFiltering;
        if (this.gl) {
            this.gl.getExtension("EXT_color_buffer_float");
            supportLinearFiltering = this.gl.getExtension("OES_texture_float_linear");
        }
        else {
            halfFloat = this.gl.getExtension("OES_texture_half_float");
            supportLinearFiltering = this.gl.getExtension("OES_texture_half_float_linear");
        }
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        var halfFloatTexType = isWebGL2
            ? this.gl.HALF_FLOAT
            : halfFloat.HALF_FLOAT_OES;
        if (isWebGL2) {
            this.ext.formatRGBA = getSupportedFormat(this.gl, this.gl.RGBA16F, this.gl.RGBA, halfFloatTexType);
            this.ext.formatRG = this.getSupportedFormat(this.gl, this.gl.RG16F, this.gl.RG, halfFloatTexType);
            this.ext.formatR = this.getSupportedFormat(this.gl, this.gl.R16F, this.gl.RED, halfFloatTexType);
        }
        else {
            this.ext.formatRGBA = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
            this.ext.formatRG = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
            this.ext.formatR = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
        }
    };
    WebGLContext.prototype.getSupportedFormat = function (internalFormat, format, type) {
        if (!supportRenderTextureFormat(this.gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case this.gl.R16F:
                    return this.getSupportedFormat(this.gl, this.gl.RG16F, this.gl.RG, type);
                case this.gl.RG16F:
                    return this.getSupportedFormat(this.gl, this.gl.RGBA16F, this.gl.RGBA, type);
                default:
                    return null;
            }
        }
        return {
            internalFormat: internalFormat,
            format: format,
        };
    };
    WebGLContext.prototype.supportRenderTextureFormat = function (internalFormat, format, type) {
        if (!this.gl)
            return;
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
        var fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        var status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        return status == this.gl.FRAMEBUFFER_COMPLETE;
    };
    return WebGLContext;
}());
export default WebGLContext;
