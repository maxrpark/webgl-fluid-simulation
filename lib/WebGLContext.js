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
        var formatRGBA;
        var formatRG;
        var formatR;
        if (isWebGL2) {
            formatRGBA = getSupportedFormat(this.gl, this.gl.RGBA16F, this.gl.RGBA, halfFloatTexType);
            formatRG = this.getSupportedFormat(this.gl, this.gl.RG16F, this.gl.RG, halfFloatTexType);
            formatR = this.getSupportedFormat(this.gl, this.gl.R16F, this.gl.RED, halfFloatTexType);
        }
        else {
            formatRGBA = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
            formatRG = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
            formatR = this.getSupportedFormat(this.gl, this.gl.RGBA, this.gl.RGBA, halfFloatTexType);
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
    return WebGLContext;
}());
export default WebGLContext;
