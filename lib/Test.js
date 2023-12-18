import PointerPrototype from "./Pointer.js";
import Material from "./shaders/Material.js";
import Program from "./Program.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";
import BlurVertexShader from "./shaders/vertex/BlurVertexShader.js";
import Time from "./utils/Time.js";
import BlurShader from "./shaders/fragment/BlurShader.js";
import CopyShader from "./shaders/fragment/CopyShader.js";
import GradientSubtractShader from "./shaders/fragment/GradientSubtractShader.js";
import PressureShader from "./shaders/fragment/PressureShader.js";
import VorticityShader from "./shaders/fragment/VorticityShader.js";
import CurlShader from "./shaders/fragment/CurlShader.js";
import DivergenceShader from "./shaders/fragment/DivergenceShader.js";
import AdvectionShader from "./shaders/fragment/AdvectionShader.js";
import SplatShader from "./shaders/fragment/SplatShader.js";
import SunraysShader from "./shaders/fragment/SunraysShader.js";
import SunRaysMaskShader from "./shaders/fragment/SunRaysMaskShader.js";
import BloomFinalShader from "./shaders/fragment/bloomFinalShader.js";
import BloomBlurShader from "./shaders/fragment/BloomBlurShader.js";
import BloomPrefilterShader from "./shaders/fragment/BloomPrefilterShader.js";
import ColorShader from "./shaders/fragment/ColorShader.js";
import ClearShader from "./shaders/fragment/ClearShader.js";
import { generateColor, scaleByPixelRatio, wrap } from "./utils/helperFunc.js";
var instance = null;
export var config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
    ONLY_HOVER: true,
};
var FluidSimulation = /** @class */ (function () {
    function FluidSimulation(canv) {
        var _this = this;
        this.bloomFramebuffers = []; // TODO;
        this.pointers = [];
        this.splatStack = [];
        if (instance) {
            return instance;
        }
        this.canvas = canv;
        this.colorUpdateTimer = 0;
        this.time = new Time();
        instance = this;
        this.time.on("tick", function () { return _this.update(); });
        var canvas = canv;
        this.resizeCanvas();
        this.pointers.push(new PointerPrototype());
        var getWebGLContext = function () {
            var params = {
                alpha: true,
                depth: false,
                stencil: false,
                antialias: false,
                preserveDrawingBuffer: false,
            };
            if (!(_this.canvas instanceof HTMLCanvasElement)) {
                throw new Error("The element of id \"TODO\" is not a HTMLCanvasElement. Make sure a <canvas id=\"TODO\"\"> element is present in the document."); // ERROR
            }
            var gl = (_this.canvas.getContext("webgl2", params));
            var isWebGL2 = !!gl; // TODO
            if (!gl)
                gl =
                    _this.canvas.getContext("webgl", params) ||
                        _this.canvas.getContext("experimental-webgl", params);
            var halfFloat;
            var supportLinearFiltering;
            if (gl) {
                gl.getExtension("EXT_color_buffer_float");
                supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
            }
            else {
                halfFloat = gl.getExtension("OES_texture_half_float");
                supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
            }
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            var halfFloatTexType = isWebGL2
                ? gl.HALF_FLOAT
                : halfFloat.HALF_FLOAT_OES;
            var formatRGBA;
            var formatRG;
            var formatR;
            if (isWebGL2) {
                formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
                formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
                formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
            }
            else {
                formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            }
            return {
                gl: gl,
                ext: {
                    formatRGBA: formatRGBA,
                    formatRG: formatRG,
                    formatR: formatR,
                    halfFloatTexType: halfFloatTexType,
                    supportLinearFiltering: supportLinearFiltering,
                },
            };
        };
        this.webGLContext = getWebGLContext(canvas);
        if (isMobile()) {
            config.DYE_RESOLUTION = 512;
        }
        if (!this.webGLContext.ext.supportLinearFiltering) {
            config.DYE_RESOLUTION = 512;
            config.SHADING = false;
            config.BLOOM = false;
            config.SUNRAYS = false;
        }
        function getSupportedFormat(gl, internalFormat, format, type) {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F:
                        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                    case gl.RG16F:
                        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                    default:
                        return null;
                }
            }
            return {
                internalFormat: internalFormat,
                format: format,
            };
        }
        function supportRenderTextureFormat(gl, internalFormat, format, type) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
            var fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status == gl.FRAMEBUFFER_COMPLETE;
        }
        function isMobile() {
            return /Mobi|Android/i.test(navigator.userAgent);
        }
        this.blit(null);
        this.baseVertexShader = new BaseVertexShader();
        this.blurVertexShader = new BlurVertexShader();
        this.blurShader = new BlurShader();
        this.copyShader = new CopyShader();
        this.clearShader = new ClearShader();
        this.colorShader = new ColorShader();
        this.bloomPrefilterShader = new BloomPrefilterShader();
        this.bloomBlurShader = new BloomBlurShader();
        this.bloomFinalShader = new BloomFinalShader();
        this.sunraysMaskShader = new SunRaysMaskShader();
        this.sunraysShader = new SunraysShader();
        this.splatShader = new SplatShader();
        this.advectionShader = new AdvectionShader();
        this.divergenceShader = new DivergenceShader();
        this.curlShader = new CurlShader();
        this.vorticityShader = new VorticityShader();
        this.pressureShader = new PressureShader();
        this.gradientSubtractShader = new GradientSubtractShader();
        this.displayMaterial = new Material(this.baseVertexShader.shader);
        this.blurProgram = new Program(this.blurVertexShader.shader, this.blurShader.shader);
        this.copyProgram = new Program(this.baseVertexShader.shader, this.copyShader.shader);
        this.clearProgram = new Program(this.baseVertexShader.shader, this.clearShader.shader);
        this.colorProgram = new Program(this.baseVertexShader.shader, this.colorShader.shader);
        this.bloomPrefilterProgram = new Program(this.baseVertexShader.shader, this.bloomPrefilterShader.shader);
        this.bloomBlurProgram = new Program(this.baseVertexShader.shader, this.bloomBlurShader.shader);
        this.bloomFinalProgram = new Program(this.baseVertexShader.shader, this.bloomFinalShader.shader);
        this.sunraysMaskProgram = new Program(this.baseVertexShader.shader, this.sunraysMaskShader.shader);
        this.sunraysProgram = new Program(this.baseVertexShader.shader, this.sunraysShader.shader);
        this.splatProgram = new Program(this.baseVertexShader.shader, this.splatShader.shader);
        this.advectionProgram = new Program(this.baseVertexShader.shader, this.advectionShader.shader);
        this.divergenceProgram = new Program(this.baseVertexShader.shader, this.divergenceShader.shader);
        this.curlProgram = new Program(this.baseVertexShader.shader, this.curlShader.shader);
        this.vorticityProgram = new Program(this.baseVertexShader.shader, this.vorticityShader.shader);
        this.pressureProgram = new Program(this.baseVertexShader.shader, this.pressureShader.shader);
        this.gradienSubtractProgram = new Program(this.baseVertexShader.shader, this.gradientSubtractShader.shader);
        this.initFramebuffers();
        var correctRadius = function (radius) {
            var aspectRatio = _this.canvas.width / _this.canvas.height;
            if (aspectRatio > 1)
                radius *= aspectRatio;
            return radius;
        };
        var splat = function (x, y, dx, dy, color) {
            _this.splatProgram.bind();
            _this.webGLContext.gl.uniform1i(_this.splatProgram.uniforms.uTarget, _this.velocity.read.attach(0));
            _this.webGLContext.gl.uniform1f(_this.splatProgram.uniforms.aspectRatio, _this.canvas.width / _this.canvas.height);
            _this.webGLContext.gl.uniform2f(_this.splatProgram.uniforms.point, x, y);
            _this.webGLContext.gl.uniform3f(_this.splatProgram.uniforms.color, dx, dy, 0.0);
            _this.webGLContext.gl.uniform1f(_this.splatProgram.uniforms.radius, _this.correctRadius(config.SPLAT_RADIUS / 100.0));
            _this.blit(_this.velocity.write);
            _this.velocity.swap();
            _this.webGLContext.gl.uniform1i(_this.splatProgram.uniforms.uTarget, _this.dye.read.attach(0));
            _this.webGLContext.gl.uniform3f(_this.splatProgram.uniforms.color, color.r, color.g, color.b);
            _this.blit(_this.dye.write);
            _this.dye.swap();
        };
        var error = this.webGLContext.gl.getError();
        if (error !== this.webGLContext.gl.NO_ERROR) {
            console.error("WebGL error:", error);
        }
        var multipleSplats = function (amount) {
            for (var i = 0; i < amount; i++) {
                var color = generateColor();
                color.r *= 10.0;
                color.g *= 10.0;
                color.b *= 10.0;
                var x = Math.random();
                var y = Math.random();
                var dx = 1000 * (Math.random() - 0.5);
                var dy = 1000 * (Math.random() - 0.5);
                splat(x, y, dx, dy, color);
            }
        };
        multipleSplats(Math.random() * 20 + 5);
        this.canvas.addEventListener("mousedown", function (e) {
            var posX = scaleByPixelRatio(e.offsetX);
            var posY = scaleByPixelRatio(e.offsetY);
            var pointer = _this.pointers.find(function (p) { return p.id == -1; });
            if (pointer == null)
                pointer = new PointerPrototype();
            updatePointerDownData(pointer, -1, posX, posY);
        });
        this.canvas.addEventListener("mousemove", function (e) {
            var pointer = _this.pointers[0];
            if (!pointer.down && config.ONLY_HOVER == false)
                return;
            var posX = scaleByPixelRatio(e.offsetX);
            var posY = scaleByPixelRatio(e.offsetY);
            updatePointerMoveData(pointer, posX, posY);
        });
        window.addEventListener("mouseup", function () {
            updatePointerUpData(_this.pointers[0]);
        });
        this.canvas.addEventListener("touchstart", function (e) {
            e.preventDefault();
            var touches = e.targetTouches;
            while (touches.length >= pointers.length)
                pointers.push(new PointerPrototype());
            for (var i = 0; i < touches.length; i++) {
                var posX = scaleByPixelRatio(touches[i].pageX);
                var posY = scaleByPixelRatio(touches[i].pageY);
                updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
            }
        });
        this.canvas.addEventListener("touchmove", function (e) {
            e.preventDefault();
            var touches = e.targetTouches;
            for (var i = 0; i < touches.length; i++) {
                var pointer = pointers[i + 1];
                if (!pointer.down)
                    continue;
                var posX = scaleByPixelRatio(touches[i].pageX);
                var posY = scaleByPixelRatio(touches[i].pageY);
                updatePointerMoveData(pointer, posX, posY);
            }
        }, false);
        window.addEventListener("touchend", function (e) {
            var touches = e.changedTouches;
            var _loop_1 = function (i) {
                var pointer = pointers.find(function (p) { return p.id == touches[i].identifier; });
                if (pointer == null)
                    return "continue";
                updatePointerUpData(pointer);
            };
            for (var i = 0; i < touches.length; i++) {
                _loop_1(i);
            }
        });
        window.addEventListener("keydown", function (e) {
            if (e.code === "KeyP")
                config.PAUSED = !config.PAUSED;
            if (e.key === " ")
                _this.splatStack.push(Math.random() * 20 + 5);
        });
        var updatePointerDownData = function (pointer, id, posX, posY) {
            pointer.id = id;
            pointer.down = true;
            pointer.moved = false;
            pointer.texcoordX = posX / _this.canvas.width;
            pointer.texcoordY = 1.0 - posY / _this.canvas.height;
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.deltaX = 0;
            pointer.deltaY = 0;
            pointer.color = generateColor();
        };
        var updatePointerMoveData = function (pointer, posX, posY) {
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.texcoordX = posX / _this.canvas.width;
            pointer.texcoordY = 1.0 - posY / _this.canvas.height;
            pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
            pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
            pointer.moved =
                Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        };
        var updatePointerUpData = function (pointer) {
            pointer.down = false;
        };
        var correctDeltaX = function (delta) {
            var aspectRatio = _this.canvas.width / _this.canvas.height;
            if (aspectRatio < 1)
                delta *= aspectRatio;
            return delta;
        };
        var correctDeltaY = function (delta) {
            var aspectRatio = _this.canvas.width / _this.canvas.height;
            if (aspectRatio > 1)
                delta /= aspectRatio;
            return delta;
        };
        this.updateKeywords();
        this.update();
    }
    FluidSimulation.prototype.updateKeywords = function () {
        var displayKeywords = [];
        if (config.SHADING)
            displayKeywords.push("SHADING");
        if (config.BLOOM)
            displayKeywords.push("BLOOM");
        if (config.SUNRAYS)
            displayKeywords.push("SUNRAYS");
        this.displayMaterial.setKeywords(displayKeywords);
    };
    FluidSimulation.prototype.resizeCanvas = function () {
        var width = scaleByPixelRatio(this.canvas.clientWidth);
        var height = scaleByPixelRatio(this.canvas.clientHeight);
        if (this.canvas.width != width || this.canvas.height != height) {
            this.canvas.width = width;
            this.canvas.height = height;
            return true;
        }
        return false;
    };
    FluidSimulation.prototype.getResolution = function (resolution) {
        var aspectRatio = this.webGLContext.gl.drawingBufferWidth /
            this.webGLContext.gl.drawingBufferHeight;
        if (aspectRatio < 1)
            aspectRatio = 1.0 / aspectRatio;
        var min = Math.round(resolution);
        var max = Math.round(resolution * aspectRatio);
        if (this.webGLContext.gl.drawingBufferWidth >
            this.webGLContext.gl.drawingBufferHeight)
            return { width: max, height: min };
        else
            return { width: min, height: max };
    };
    FluidSimulation.prototype.blit = function (target) {
        var _this = this;
        this.webGLContext.gl.bindBuffer(this.webGLContext.gl.ARRAY_BUFFER, this.webGLContext.gl.createBuffer());
        this.webGLContext.gl.bufferData(this.webGLContext.gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), this.webGLContext.gl.STATIC_DRAW);
        this.webGLContext.gl.bindBuffer(this.webGLContext.gl.ELEMENT_ARRAY_BUFFER, this.webGLContext.gl.createBuffer());
        this.webGLContext.gl.bufferData(this.webGLContext.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), this.webGLContext.gl.STATIC_DRAW);
        this.webGLContext.gl.vertexAttribPointer(0, 2, this.webGLContext.gl.FLOAT, false, 0, 0);
        this.webGLContext.gl.enableVertexAttribArray(0);
        var func = function (target, clear) {
            if (clear === void 0) { clear = false; }
            if (target == null) {
                _this.webGLContext.gl.viewport(0, 0, _this.webGLContext.gl.drawingBufferWidth, _this.webGLContext.gl.drawingBufferHeight);
                _this.webGLContext.gl.bindFramebuffer(_this.webGLContext.gl.FRAMEBUFFER, null);
            }
            else {
                _this.webGLContext.gl.viewport(0, 0, target.width, target.height);
                _this.webGLContext.gl.bindFramebuffer(_this.webGLContext.gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                _this.webGLContext.gl.clearColor(0.0, 0.0, 0.0, 1.0);
                _this.webGLContext.gl.clear(_this.webGLContext.gl.COLOR_BUFFER_BIT);
            }
            _this.webGLContext.gl.drawElements(_this.webGLContext.gl.TRIANGLES, 6, _this.webGLContext.gl.UNSIGNED_SHORT, 0);
        };
        func(target);
    };
    FluidSimulation.prototype.drawColor = function (target, color) {
        this.colorProgram.bind();
        this.webGLContext.gl.uniform4f(this.colorProgram.uniforms.color, color.r, color.g, color.b, 1);
        this.blit(target);
    };
    // HELPER
    FluidSimulation.prototype.normalizeColor = function (input) {
        var output = {
            r: input.r / 255,
            g: input.g / 255,
            b: input.b / 255,
        };
        return output;
    };
    FluidSimulation.prototype.render = function (target) {
        if (config.BLOOM)
            this.applyBloom(this.dye.read, this.bloom);
        if (config.SUNRAYS) {
            this.applySunrays(this.dye.read, this.dye.write, this.sunrays);
            this.blur(this.sunrays, this.sunraysTemp, 1);
        }
        if (target == null || !config.TRANSPARENT) {
            this.webGLContext.gl.blendFunc(this.webGLContext.gl.ONE, this.webGLContext.gl.ONE_MINUS_SRC_ALPHA);
            this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
        }
        else {
            this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        }
        if (target == null || !config.TRANSPARENT) {
            this.webGLContext.gl.blendFunc(this.webGLContext.gl.ONE, this.webGLContext.gl.ONE_MINUS_SRC_ALPHA);
            this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
        }
        else {
            this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        }
        if (!config.TRANSPARENT)
            this.drawColor(target, this.normalizeColor(config.BACK_COLOR));
        if (target == null && config.TRANSPARENT)
            drawCheckerboard(target);
        this.displayMaterial.drawDisplay(target);
    };
    FluidSimulation.prototype.updateColors = function (dt) {
        if (!config.COLORFUL)
            return;
        this.colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (this.colorUpdateTimer >= 1) {
            this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);
            this.pointers.forEach(function (p) {
                p.color = generateColor();
            });
        }
    };
    FluidSimulation.prototype.initFramebuffers = function () {
        var simRes = this.getResolution(config.SIM_RESOLUTION);
        var dyeRes = this.getResolution(config.DYE_RESOLUTION);
        var texType = this.webGLContext.ext.halfFloatTexType;
        var rgba = this.webGLContext.ext.formatRGBA;
        var rg = this.webGLContext.ext.formatRG;
        var r = this.webGLContext.ext.formatR;
        var filtering = this.webGLContext.ext.supportLinearFiltering
            ? this.webGLContext.gl.LINEAR
            : this.webGLContext.gl.NEAREST;
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        if (this.dye == null)
            this.dye = this.createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else
            this.dye = this.resizeDoubleFBO(this.dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        if (this.velocity == null)
            this.velocity = this.createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else
            this.velocity = this.resizeDoubleFBO(this.velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        this.divergence = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.webGLContext.gl.NEAREST);
        this.curl = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.webGLContext.gl.NEAREST);
        this.pressure = this.createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.webGLContext.gl.NEAREST);
        this.initBloomFramebuffers();
        this.initSunraysFramebuffers();
    };
    FluidSimulation.prototype.update = function () {
        if (this.resizeCanvas())
            this.initFramebuffers();
        this.updateColors(this.time.delta);
        this.applyInputs();
        if (!config.PAUSED)
            this.step(this.time.delta);
        this.render(null);
    };
    FluidSimulation.prototype.applyInputs = function () {
        var _this = this;
        if (this.splatStack.length > 0)
            multipleSplats(this.splatStack.pop());
        this.pointers.forEach(function (p) {
            if (p.moved) {
                p.moved = false;
                _this.splatPointer(p);
            }
        });
    };
    FluidSimulation.prototype.createDoubleFBO = function (w, h, internalFormat, format, type, param) {
        var fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
        var fbo2 = this.createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() {
                return fbo1;
            },
            set read(value) {
                fbo1 = value;
            },
            get write() {
                return fbo2;
            },
            set write(value) {
                fbo2 = value;
            },
            swap: function () {
                var temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            },
        };
    };
    FluidSimulation.prototype.resizeFBO = function (target, w, h, internalFormat, format, type, param) {
        var newFBO = this.createFBO(w, h, internalFormat, format, type, param);
        copyProgram.bind();
        this.webGLContext.gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
        this.blit(newFBO);
        return newFBO;
    };
    FluidSimulation.prototype.resizeDoubleFBO = function (target, w, h, internalFormat, format, type, param) {
        if (target.width == w && target.height == h)
            return target;
        target.read = this.resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = this.createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    };
    FluidSimulation.prototype.createFBO = function (w, h, internalFormat, format, type, param) {
        this.webGLContext.gl.activeTexture(this.webGLContext.gl.TEXTURE0);
        var texture = this.webGLContext.gl.createTexture();
        this.webGLContext.gl.bindTexture(this.webGLContext.gl.TEXTURE_2D, texture);
        this.webGLContext.gl.texParameteri(this.webGLContext.gl.TEXTURE_2D, this.webGLContext.gl.TEXTURE_MIN_FILTER, param);
        this.webGLContext.gl.texParameteri(this.webGLContext.gl.TEXTURE_2D, this.webGLContext.gl.TEXTURE_MAG_FILTER, param);
        this.webGLContext.gl.texParameteri(this.webGLContext.gl.TEXTURE_2D, this.webGLContext.gl.TEXTURE_WRAP_S, this.webGLContext.gl.CLAMP_TO_EDGE);
        this.webGLContext.gl.texParameteri(this.webGLContext.gl.TEXTURE_2D, this.webGLContext.gl.TEXTURE_WRAP_T, this.webGLContext.gl.CLAMP_TO_EDGE);
        this.webGLContext.gl.texImage2D(this.webGLContext.gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
        var fbo = this.webGLContext.gl.createFramebuffer();
        this.webGLContext.gl.bindFramebuffer(this.webGLContext.gl.FRAMEBUFFER, fbo);
        this.webGLContext.gl.framebufferTexture2D(this.webGLContext.gl.FRAMEBUFFER, this.webGLContext.gl.COLOR_ATTACHMENT0, this.webGLContext.gl.TEXTURE_2D, texture, 0);
        this.webGLContext.gl.viewport(0, 0, w, h);
        this.webGLContext.gl.clear(this.webGLContext.gl.COLOR_BUFFER_BIT);
        var texelSizeX = 1.0 / w;
        var texelSizeY = 1.0 / h;
        var gl = this.webGLContext.gl;
        return {
            texture: texture,
            fbo: fbo,
            width: w,
            height: h,
            texelSizeX: texelSizeX,
            texelSizeY: texelSizeY,
            attach: function (id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
    };
    FluidSimulation.prototype.initBloomFramebuffers = function () {
        var res = this.getResolution(config.BLOOM_RESOLUTION);
        var texType = this.webGLContext.ext.halfFloatTexType;
        var rgba = this.webGLContext.ext.formatRGBA;
        var filtering = this.webGLContext.ext.supportLinearFiltering
            ? this.webGLContext.gl.LINEAR
            : this.webGLContext.gl.NEAREST;
        this.bloom = this.createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);
        // const bloomFramebuffers = {
        //   length: 0,
        // };
        // bloomFramebuffers.length = 0;
        for (var i = 0; i < config.BLOOM_ITERATIONS; i++) {
            var width = res.width >> (i + 1);
            var height = res.height >> (i + 1);
            if (width < 2 || height < 2)
                break;
            this.fbo = this.createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
            this.bloomFramebuffers.push(this.fbo);
        }
    };
    FluidSimulation.prototype.initSunraysFramebuffers = function () {
        var res = this.getResolution(config.SUNRAYS_RESOLUTION);
        var texType = this.webGLContext.ext.halfFloatTexType;
        var r = this.webGLContext.ext.formatR;
        var filtering = this.webGLContext.ext.supportLinearFiltering
            ? this.webGLContext.gl.LINEAR
            : this.webGLContext.gl.NEAREST;
        this.sunrays = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
        this.sunraysTemp = this.createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
    };
    FluidSimulation.prototype.step = function (dt) {
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.curlProgram.bind();
        this.webGLContext.gl.uniform2f(this.curlProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.curl);
        this.vorticityProgram.bind();
        this.webGLContext.gl.uniform2f(this.vorticityProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.velocity.read.attach(0));
        this.webGLContext.gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1));
        this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.curl, config.CURL);
        this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
        this.blit(this.velocity.write);
        this.velocity.swap();
        this.divergenceProgram.bind();
        this.webGLContext.gl.uniform2f(this.divergenceProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.divergence);
        this.clearProgram.bind();
        this.webGLContext.gl.uniform1i(this.clearProgram.uniforms.uTexture, this.pressure.read.attach(0));
        this.webGLContext.gl.uniform1f(this.clearProgram.uniforms.value, config.PRESSURE);
        this.blit(this.pressure.write);
        this.pressure.swap();
        this.pressureProgram.bind();
        this.webGLContext.gl.uniform2f(this.pressureProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.divergence.attach(0));
        for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            this.webGLContext.gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.pressure.read.attach(1));
            this.blit(this.pressure.write);
            this.pressure.swap();
        }
        this.gradienSubtractProgram.bind();
        this.webGLContext.gl.uniform2f(this.gradienSubtractProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.gradienSubtractProgram.uniforms.uPressure, this.pressure.read.attach(0));
        this.webGLContext.gl.uniform1i(this.gradienSubtractProgram.uniforms.uVelocity, this.velocity.read.attach(1));
        this.blit(this.velocity.write);
        this.velocity.swap();
        this.advectionProgram.bind();
        this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        var velocityId = this.velocity.read.attach(0);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        this.blit(this.velocity.write);
        this.velocity.swap();
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.dye.texelSizeX, this.dye.texelSizeY);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read.attach(0));
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uSource, this.dye.read.attach(1));
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        this.blit(this.dye.write);
        this.dye.swap();
    };
    FluidSimulation.prototype.splatPointer = function (pointer) {
        var dx = pointer.deltaX * config.SPLAT_FORCE;
        var dy = pointer.deltaY * config.SPLAT_FORCE;
        this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    };
    FluidSimulation.prototype.splat = function (x, y, dx, dy, color) {
        this.splatProgram.bind();
        this.webGLContext.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.velocity.read.attach(0));
        this.webGLContext.gl.uniform1f(this.splatProgram.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        this.webGLContext.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
        this.webGLContext.gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
        this.webGLContext.gl.uniform1f(this.splatProgram.uniforms.radius, this.correctRadius(config.SPLAT_RADIUS / 100.0));
        this.blit(this.velocity.write);
        this.velocity.swap();
        this.webGLContext.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.dye.read.attach(0));
        this.webGLContext.gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
        this.blit(this.dye.write);
        this.dye.swap();
    };
    FluidSimulation.prototype.correctRadius = function (radius) {
        var aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1)
            radius *= aspectRatio;
        return radius;
    };
    FluidSimulation.prototype.applyBloom = function (source, destination) {
        if (this.bloomFramebuffers.length < 2)
            return;
        var last = destination;
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.bloomPrefilterProgram.bind();
        var knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
        var curve0 = config.BLOOM_THRESHOLD - knee;
        var curve1 = knee * 2;
        var curve2 = 0.25 / knee;
        this.webGLContext.gl.uniform3f(this.bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
        this.webGLContext.gl.uniform1f(this.bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
        this.webGLContext.gl.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
        this.blit(last);
        this.bloomBlurProgram.bind();
        for (var i = 0; i < this.bloomFramebuffers.length; i++) {
            var dest = this.bloomFramebuffers[i];
            this.webGLContext.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.webGLContext.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.blit(dest);
            last = dest;
        }
        this.webGLContext.gl.blendFunc(this.webGLContext.gl.ONE, this.webGLContext.gl.ONE);
        this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
        for (var i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
            var baseTex = this.bloomFramebuffers[i];
            this.webGLContext.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.webGLContext.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.webGLContext.gl.viewport(0, 0, baseTex.width, baseTex.height);
            this.blit(baseTex);
            last = baseTex;
        }
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.bloomFinalProgram.bind();
        this.webGLContext.gl.uniform2f(this.bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        this.webGLContext.gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
        this.webGLContext.gl.uniform1f(this.bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
        this.blit(destination);
    };
    FluidSimulation.prototype.applySunrays = function (source, mask, destination) {
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.sunraysMaskProgram.bind();
        this.webGLContext.gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, source.attach(0));
        this.blit(mask);
        this.sunraysProgram.bind();
        this.webGLContext.gl.uniform1f(this.sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
        this.webGLContext.gl.uniform1i(this.sunraysProgram.uniforms.uTexture, mask.attach(0));
        this.blit(destination);
    };
    FluidSimulation.prototype.blur = function (target, temp, iterations) {
        this.blurProgram.bind();
        for (var i = 0; i < iterations; i++) {
            this.webGLContext.gl.uniform2f(this.blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
            this.webGLContext.gl.uniform1i(this.blurProgram.uniforms.uTexture, target.attach(0));
            this.blit(temp);
            this.webGLContext.gl.uniform2f(this.blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
            this.webGLContext.gl.uniform1i(this.blurProgram.uniforms.uTexture, temp.attach(0));
            this.blit(target);
        }
    };
    return FluidSimulation;
}());
export default FluidSimulation;
