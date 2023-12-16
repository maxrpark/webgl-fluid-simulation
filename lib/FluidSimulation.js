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
import CheckerboardShader from "./shaders/fragment/CheckerboardShader.js";
import ColorShader from "./shaders/fragment/ColorShader.js";
import ClearShader from "./shaders/fragment/ClearShader.js";
import { generateColor, normalizeColor, scaleByPixelRatio, wrap, } from "./utils/helperFunc.js";
import WebGLContext from "./WebGLContext.js";
import Canvas from "./Canvas.js";
import Pointer from "./Pointer.js";
import config from "./utils/config.js";
var instance = null;
var FluidSimulation = /** @class */ (function () {
    function FluidSimulation(canvas) {
        var _this = this;
        this.pointers = [];
        this.splatStack = [];
        this.drawCheckerboard = function (target) {
            checkerboardProgram.bind();
            _this.webGLContext.gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, _this.canvas.width / _this.canvas.height);
            _this.webGLContext.blit(target);
        };
        if (instance) {
            return instance;
        }
        instance = this;
        this.canvas = new Canvas(canvas);
        this.colorUpdateTimer = 0;
        this.time = new Time();
        this.time.on("tick", function () { return _this.update(); });
        this.pointers.push(new Pointer());
        this.canvas.on("mousemove", function (e) { return _this.mouseMove(e); });
        this.canvas.on("mouseup", function () { return _this.mouseUp(); });
        this.canvas.on("touchstart", function (e) { return _this.touchStart(e); });
        this.canvas.on("touchmove", function (e) { return _this.touchMove(e); });
        this.canvas.on("touchend", function (e) { return _this.touchEnd(e); });
        this.canvas.on("keydown", function (e) { return _this.keyDown(e); });
        this.canvas.on("resize", function (e) { return _this.onResize(); });
        this.webGLContext = new WebGLContext();
        if (isMobile()) {
            config.DYE_RESOLUTION = 512;
        }
        if (!this.webGLContext.ext.supportLinearFiltering) {
            config.DYE_RESOLUTION = 512;
            config.SHADING = false;
            config.BLOOM = false;
            config.SUNRAYS = false;
        }
        function isMobile() {
            return /Mobi|Android/i.test(navigator.userAgent);
        }
        this.baseVertexShader = new BaseVertexShader();
        this.blurVertexShader = new BlurVertexShader();
        this.blurShader = new BlurShader();
        this.copyShader = new CopyShader();
        this.clearShader = new ClearShader();
        this.colorShader = new ColorShader();
        this.checkerboardShader = new CheckerboardShader();
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
        this.checkerboardProgram = new Program(this.baseVertexShader.shader, this.checkerboardShader.shader);
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
        this.webGLContext.initFramebuffers();
        var error = this.webGLContext.gl.getError();
        if (error !== this.webGLContext.gl.NO_ERROR) {
            console.error("WebGL error:", error);
        }
        var splat = function (x, y, dx, dy, color) {
            _this.splatProgram.bind();
            _this.webGLContext.gl.uniform1i(_this.splatProgram.uniforms.uTarget, _this.webGLContext.velocity.read.attach(0));
            _this.webGLContext.gl.uniform1f(_this.splatProgram.uniforms.aspectRatio, _this.canvas.width / _this.canvas.height);
            _this.webGLContext.gl.uniform2f(_this.splatProgram.uniforms.point, x, y);
            _this.webGLContext.gl.uniform3f(_this.splatProgram.uniforms.color, dx, dy, 0.0);
            _this.webGLContext.gl.uniform1f(_this.splatProgram.uniforms.radius, _this.correctRadius(config.SPLAT_RADIUS / 100.0));
            _this.webGLContext.blit(_this.webGLContext.velocity.write);
            _this.webGLContext.velocity.swap();
            _this.webGLContext.gl.uniform1i(_this.splatProgram.uniforms.uTarget, _this.webGLContext.dye.read.attach(0));
            _this.webGLContext.gl.uniform3f(_this.splatProgram.uniforms.color, color.r, color.g, color.b);
            _this.webGLContext.blit(_this.webGLContext.dye.write);
            _this.webGLContext.dye.swap();
        };
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
        // this.updateKeywords();
        this.update();
    }
    // MOVE TO MATERIAL
    // updateKeywords() {
    //   let displayKeywords = [];
    //   if (config.SHADING) displayKeywords.push("SHADING");
    //   if (config.BLOOM) displayKeywords.push("BLOOM");
    //   if (config.SUNRAYS) displayKeywords.push("SUNRAYS");
    //   this.displayMaterial.setKeywords(displayKeywords);
    // }
    FluidSimulation.prototype.drawColor = function (target, color) {
        this.colorProgram.bind();
        this.webGLContext.gl.uniform4f(this.colorProgram.uniforms.color, color.r, color.g, color.b, 1);
        this.webGLContext.blit(target);
    };
    FluidSimulation.prototype.render = function (target) {
        if (config.BLOOM)
            this.applyBloom(this.webGLContext.dye.read, this.webGLContext.bloom);
        if (config.SUNRAYS) {
            this.applySunrays(this.webGLContext.dye.read, this.webGLContext.dye.write, this.webGLContext.sunrays);
            this.blur(this.webGLContext.sunrays, this.webGLContext.sunraysTemp, 1);
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
            this.drawColor(target, normalizeColor(config.BACK_COLOR));
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
    FluidSimulation.prototype.splatPointer = function (pointer) {
        var dx = pointer.deltaX * config.SPLAT_FORCE;
        var dy = pointer.deltaY * config.SPLAT_FORCE;
        this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    };
    FluidSimulation.prototype.splat = function (x, y, dx, dy, color) {
        this.splatProgram.bind();
        this.webGLContext.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.gl.uniform1f(this.splatProgram.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        this.webGLContext.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
        this.webGLContext.gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
        this.webGLContext.gl.uniform1f(this.splatProgram.uniforms.radius, this.correctRadius(config.SPLAT_RADIUS / 100.0));
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.webGLContext.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.webGLContext.dye.read.attach(0));
        this.webGLContext.gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
        this.webGLContext.blit(this.webGLContext.dye.write);
        this.webGLContext.dye.swap();
    };
    FluidSimulation.prototype.correctRadius = function (radius) {
        var aspectRatio = this.canvas.width / this.canvas.height;
        if (aspectRatio > 1)
            radius *= aspectRatio;
        return radius;
    };
    FluidSimulation.prototype.applyBloom = function (source, destination) {
        if (this.webGLContext.bloomFramebuffers.length < 2)
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
        this.webGLContext.blit(last);
        this.bloomBlurProgram.bind();
        for (var i = 0; i < this.webGLContext.bloomFramebuffers.length; i++) {
            var dest = this.webGLContext.bloomFramebuffers[i];
            this.webGLContext.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.webGLContext.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.webGLContext.blit(dest);
            last = dest;
        }
        this.webGLContext.gl.blendFunc(this.webGLContext.gl.ONE, this.webGLContext.gl.ONE);
        this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
        for (var i = this.webGLContext.bloomFramebuffers.length - 2; i >= 0; i--) {
            var baseTex = this.webGLContext.bloomFramebuffers[i];
            this.webGLContext.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.webGLContext.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.webGLContext.gl.viewport(0, 0, baseTex.width, baseTex.height);
            this.webGLContext.blit(baseTex);
            last = baseTex;
        }
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.bloomFinalProgram.bind();
        this.webGLContext.gl.uniform2f(this.bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        this.webGLContext.gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
        this.webGLContext.gl.uniform1f(this.bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
        this.webGLContext.blit(destination);
    };
    FluidSimulation.prototype.applySunrays = function (source, mask, destination) {
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.sunraysMaskProgram.bind();
        this.webGLContext.gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, source.attach(0));
        this.webGLContext.blit(mask);
        this.sunraysProgram.bind();
        this.webGLContext.gl.uniform1f(this.sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
        this.webGLContext.gl.uniform1i(this.sunraysProgram.uniforms.uTexture, mask.attach(0));
        this.webGLContext.blit(destination);
    };
    FluidSimulation.prototype.blur = function (target, temp, iterations) {
        this.blurProgram.bind();
        for (var i = 0; i < iterations; i++) {
            this.webGLContext.gl.uniform2f(this.blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
            this.webGLContext.gl.uniform1i(this.blurProgram.uniforms.uTexture, target.attach(0));
            this.webGLContext.blit(temp);
            this.webGLContext.gl.uniform2f(this.blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
            this.webGLContext.gl.uniform1i(this.blurProgram.uniforms.uTexture, temp.attach(0));
            this.webGLContext.blit(target);
        }
    };
    FluidSimulation.prototype.step = function (dt) {
        this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
        this.curlProgram.bind();
        this.webGLContext.gl.uniform2f(this.curlProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.blit(this.webGLContext.curl);
        this.vorticityProgram.bind();
        this.webGLContext.gl.uniform2f(this.vorticityProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.webGLContext.curl.attach(1));
        this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.curl, config.CURL);
        this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.divergenceProgram.bind();
        this.webGLContext.gl.uniform2f(this.divergenceProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.blit(this.webGLContext.divergence);
        this.clearProgram.bind();
        this.webGLContext.gl.uniform1i(this.clearProgram.uniforms.uTexture, this.webGLContext.pressure.read.attach(0));
        this.webGLContext.gl.uniform1f(this.clearProgram.uniforms.value, config.PRESSURE);
        this.webGLContext.blit(this.webGLContext.pressure.write);
        this.webGLContext.pressure.swap();
        this.pressureProgram.bind();
        this.webGLContext.gl.uniform2f(this.pressureProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.webGLContext.divergence.attach(0));
        for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            this.webGLContext.gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.webGLContext.pressure.read.attach(1));
            this.webGLContext.blit(this.webGLContext.pressure.write);
            this.webGLContext.pressure.swap();
        }
        this.gradienSubtractProgram.bind();
        this.webGLContext.gl.uniform2f(this.gradienSubtractProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.webGLContext.gl.uniform1i(this.gradienSubtractProgram.uniforms.uPressure, this.webGLContext.pressure.read.attach(0));
        this.webGLContext.gl.uniform1i(this.gradienSubtractProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(1));
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.advectionProgram.bind();
        this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        var velocityId = this.webGLContext.velocity.read.attach(0);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.webGLContext.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.webGLContext.dye.texelSizeX, this.webGLContext.dye.texelSizeY);
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.gl.uniform1i(this.advectionProgram.uniforms.uSource, this.webGLContext.dye.read.attach(1));
        this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        this.webGLContext.blit(this.webGLContext.dye.write);
        this.webGLContext.dye.swap();
    };
    FluidSimulation.prototype.update = function () {
        this.updateColors(this.time.delta);
        this.applyInputs();
        if (!config.PAUSED)
            this.step(this.time.delta);
        this.render(null);
    };
    FluidSimulation.prototype.onResize = function () {
        this.webGLContext.initFramebuffers();
    };
    //EVENTS
    FluidSimulation.prototype.mouseMove = function (e) {
        var pointer = this.pointers[0];
        if (!pointer.down && config.ONLY_HOVER == false)
            return;
        pointer.updatePointerMoveData(e.offsetX, e.offsetY);
    };
    FluidSimulation.prototype.mouseUp = function () {
        this.pointers[0].setPointerDown();
    };
    FluidSimulation.prototype.touchStart = function (e) {
        e.preventDefault();
        var touches = e.targetTouches;
        while (touches.length >= this.pointers.length)
            this.pointers.push(new Pointer());
        for (var i = 0; i < touches.length; i++) {
            var posX = scaleByPixelRatio(touches[i].pageX);
            var posY = scaleByPixelRatio(touches[i].pageY);
            this.pointers[i + 1].onTouchStart(touches[i].identifier, posX, posY);
            this.pointers[i + 1].color = generateColor();
        }
    };
    FluidSimulation.prototype.touchMove = function (e) {
        e.preventDefault();
        var touches = e.targetTouches;
        for (var i = 0; i < touches.length; i++) {
            var pointer = this.pointers[i + 1];
            if (!pointer.down)
                continue;
            pointer.updatePointerMoveData(touches[i].pageX, touches[i].pageY);
        }
    };
    FluidSimulation.prototype.touchEnd = function (e) {
        var touches = e.changedTouches;
        var _loop_1 = function (i) {
            var pointer = this_1.pointers.find(function (p) { return p.id == touches[i].identifier; });
            if (pointer == null)
                return "continue";
            pointer.setPointerDown();
        };
        var this_1 = this;
        for (var i = 0; i < touches.length; i++) {
            _loop_1(i);
        }
    };
    FluidSimulation.prototype.keyDown = function (e) {
        if (e.code === "KeyP")
            config.PAUSED = !config.PAUSED;
        if (e.key === " ")
            this.splatStack.push(Math.random() * 20 + 5);
    };
    return FluidSimulation;
}());
export default FluidSimulation;
