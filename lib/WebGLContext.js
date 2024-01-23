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
import { FramebufferObject } from "./FramebufferObject.js";
import Target from "./Target.js";
import EventEmitter from "./utils/EventEmitter.js";
var WebGLContext = /** @class */ (function (_super) {
    __extends(WebGLContext, _super);
    function WebGLContext(props) {
        var _this = _super.call(this) || this;
        _this.bloomFramebuffers = []; // TODO;
        Object.assign(_this, props);
        _this.ext = {
            formatRGBA: null,
            formatRG: null,
            formatR: null,
            halfFloatTexType: null,
            supportLinearFiltering: null,
        };
        _this.getWebGLContext();
        return _this;
    }
    WebGLContext.prototype.getWebGLContext = function () {
        var params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error("The element of id \"TODO\" is not a HTMLCanvasElement. Make sure a <canvas id=\"TODO\"\"> element is present in the document."); // ERROR
        }
        this.gl = this.canvas.getContext("webgl2", params);
        var isWebGL2 = !!this.gl; // TODO
        console.log(this.canvas);
        if (!isWebGL2)
            this.gl =
                this.canvas.getContext("webgl", params) ||
                    this.canvas.getContext("experimental-webgl", params);
        var halfFloat = null;
        if (isWebGL2) {
            this.gl.getExtension("EXT_color_buffer_float");
            this.ext.supportLinearFiltering = this.gl.getExtension("OES_texture_float_linear");
        }
        else {
            halfFloat = this.gl.getExtension("OES_texture_half_float");
            this.ext.supportLinearFiltering = this.gl.getExtension("OES_texture_half_float_linear");
        }
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.ext.halfFloatTexType = isWebGL2
            ? this.gl.HALF_FLOAT
            : halfFloat.HALF_FLOAT_OES;
        if (isWebGL2) {
            this.ext.formatRGBA = this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, this.ext.halfFloatTexType);
            this.ext.formatRG = this.getSupportedFormat(this.gl.RG16F, this.gl.RG, this.ext.halfFloatTexType);
            this.ext.formatR = this.getSupportedFormat(this.gl.R16F, this.gl.RED, this.ext.halfFloatTexType);
        }
        else {
            this.ext.formatRGBA = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.ext.halfFloatTexType);
            this.ext.formatRG = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.ext.halfFloatTexType);
            this.ext.formatR = this.getSupportedFormat(this.gl.RGBA, this.gl.RGBA, this.ext.halfFloatTexType);
        }
    };
    WebGLContext.prototype.getSupportedFormat = function (internalFormat, format, type) {
        if (!this.gl)
            return;
        if (!this.supportRenderTextureFormat(internalFormat, format, type)) {
            switch (internalFormat) {
                case this.gl.R16F:
                    return this.getSupportedFormat(this.gl.RG16F, this.gl.RG, type);
                case this.gl.RG16F:
                    return this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, type);
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
        var framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        var status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        return status == this.gl.FRAMEBUFFER_COMPLETE;
    };
    WebGLContext.prototype.createFBO = function (width, height, internalFormat, format, type, minFilter) {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var texelSizeX = 1.0 / width;
        var texelSizeY = 1.0 / height;
        return new FramebufferObject({
            gl: this.gl,
            texture: texture,
            framebuffer: framebuffer,
            width: width,
            height: height,
            texelSizeX: texelSizeX,
            texelSizeY: texelSizeY,
        });
    };
    WebGLContext.prototype.resizeFBO = function (target, w, h, internalFormat, format, type, param) {
        var newFBO = this.createFBO(w, h, internalFormat, format, type, param);
        this.trigger("onResizeFBO", [target]);
        this.blit(newFBO);
        return newFBO;
    };
    WebGLContext.prototype.resizeDoubleFBO = function (target, width, height, internalFormat, format, type, param) {
        if (target.width === width && target.height === height) {
            return target;
        }
        target.read = this.resizeFBO(target.read, width, height, internalFormat, format, type, param);
        target.write = this.createFBO(width, height, internalFormat, format, type, param);
        target.width = width;
        target.height = height;
        target.texelSizeX = 1.0 / width;
        target.texelSizeY = 1.0 / height;
        return target;
    };
    WebGLContext.prototype.createDoubleFBO = function (width, height, internalFormat, format, type, param) {
        var fbo1 = this.createFBO(width, height, internalFormat, format, type, param);
        var fbo2 = this.createFBO(width, height, internalFormat, format, type, param);
        return new Target({
            read: fbo1,
            write: fbo2,
            width: width,
            height: height,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
        });
    };
    WebGLContext.prototype.blit = function (target) {
        var _this = this;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
        var func = function (target, clear) {
            if (clear === void 0) { clear = false; }
            if (target == null) {
                _this.gl.viewport(0, 0, _this.gl.drawingBufferWidth, _this.gl.drawingBufferHeight);
                _this.gl.bindFramebuffer(_this.gl.FRAMEBUFFER, null);
            }
            else {
                //Resize
                _this.gl.viewport(0, 0, target.width, target.height);
                _this.gl.bindFramebuffer(_this.gl.FRAMEBUFFER, target.framebuffer);
            }
            if (clear) {
                _this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
                _this.gl.clear(_this.gl.COLOR_BUFFER_BIT);
            }
            _this.gl.drawElements(_this.gl.TRIANGLES, 6, _this.gl.UNSIGNED_SHORT, 0);
        };
        func(target);
    };
    WebGLContext.prototype.initFramebuffers = function () {
        var simRes = this.getResolution(this.config.simResolution);
        var dyeRes = this.getResolution(this.config.dyeResolution);
        var texType = this.ext.halfFloatTexType;
        var rgba = this.ext.formatRGBA;
        var rg = this.ext.formatRG;
        var r = this.ext.formatR;
        var filtering = this.ext.supportLinearFiltering
            ? this.gl.LINEAR
            : this.gl.NEAREST;
        this.gl.disable(this.gl.BLEND);
        if (this.dye == null)
            this.dye = this.createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else
            this.dye = this.resizeDoubleFBO(this.dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        if (this.velocity == null)
            this.velocity = this.createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else
            this.velocity = this.resizeDoubleFBO(this.velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        this.divergence = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.curl = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.pressure = this.createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.initBloomFramebuffers();
        this.initSunraysFramebuffers();
    };
    WebGLContext.prototype.initBloomFramebuffers = function () {
        var res = this.getResolution(this.config.bloomResolution);
        var texType = this.ext.halfFloatTexType;
        var rgba = this.ext.formatRGBA;
        var filtering = this.ext.supportLinearFiltering
            ? this.gl.LINEAR
            : this.gl.NEAREST;
        this.bloom = this.createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);
        for (var i = 0; i < this.config.bloomIterations; i++) {
            var width = res.width >> (i + 1);
            var height = res.height >> (i + 1);
            if (width < 2 || height < 2)
                break;
            var framebuffer = this.createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
            this.bloomFramebuffers.push(framebuffer);
        }
    };
    WebGLContext.prototype.initSunraysFramebuffers = function () {
        var res = this.getResolution(this.config.sunraysResolution);
        var texType = this.ext.halfFloatTexType;
        var r = this.ext.formatR;
        var filtering = this.ext.supportLinearFiltering
            ? this.gl.LINEAR
            : this.gl.NEAREST;
        this.sunrays = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
        this.sunraysTemp = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
    };
    WebGLContext.prototype.getResolution = function (resolution) {
        var aspectRatio = this.gl.drawingBufferWidth / this.gl.drawingBufferHeight;
        if (aspectRatio < 1)
            aspectRatio = 1.0 / aspectRatio;
        var min = Math.round(resolution);
        var max = Math.round(resolution * aspectRatio);
        if (this.gl.drawingBufferWidth > this.gl.drawingBufferHeight)
            return { width: max, height: min };
        else
            return { width: min, height: max };
    };
    return WebGLContext;
}(EventEmitter));
export default WebGLContext;
