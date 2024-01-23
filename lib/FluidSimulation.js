var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import Time from "./utils/Time.js";
import Material from "./shaders/Material.js";
import Program from "./Program.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";
import BlurVertexShader from "./shaders/vertex/BlurVertexShader.js";
import { BlurShader, CopyShader, GradientSubtractShader, PressureShader, VorticityShader, CurlShader, DivergenceShader, AdvectionShader, SplatShader, SunraysShader, SunRaysMaskShader, BloomFinalShader, BloomBlurShader, BloomPrefilterShader, ColorShader, ClearShader, } from "./shaders/fragment/index.js";
import { generateColor, normalizeColor, uuid, wrap, } from "./utils/helperFunc.js";
import WebGLContext from "./WebGLContext.js";
import Canvas from "./Canvas.js";
import Pointer from "./Pointer.js";
var FluidSimulation = /** @class */ (function () {
    function FluidSimulation(props) {
        var _this = this;
        this.pointers = [];
        this.splatStack = [];
        this.config = {
            simResolution: 128,
            dyeResolution: 1024,
            isTexture: false,
            densityDissipation: 1,
            velocityDissipation: 0.2,
            pressure: 0.8,
            pressureIterations: 20,
            curl: 30,
            splatRadius: 0.25,
            splatForce: 6000,
            shading: true,
            colorful: true,
            colorUpdateSpeed: 10,
            paused: false,
            backGroundColor: "#000000",
            transparent: false,
            bloom: false,
            bloomIterations: 8,
            bloomResolution: 256,
            bloomIntensity: 0.8,
            bloomThreshold: 0.6,
            bloomSoftKnee: 0.7,
            sunrays: false,
            sunraysResolution: 196,
            sunraysWeigth: 1.0,
            onlyHover: true,
            className: "",
            canvasContainer: "",
        };
        this.uuid = uuid();
        var configProps = props.config;
        this.config = __assign(__assign({}, this.config), configProps);
        this.canvasClass = new Canvas(this.config.className, this.config.canvasContainer, this.config.isTexture);
        this.canvasClass.on("mousedown", function (e) { return _this.mouseDown(e); });
        this.canvasClass.on("mousemove", function (e) { return _this.mouseMove(e); });
        this.canvasClass.on("mouseup", function () { return _this.mouseUp(); });
        this.canvasClass.on("touchstart", function (e) { return _this.touchStart(e); });
        this.canvasClass.on("touchmove", function (e) { return _this.touchMove(e); });
        this.canvasClass.on("touchend", function (e) { return _this.touchEnd(e); });
        this.canvasClass.on("keydown", function (e) { return _this.keyDown(e); });
        this.canvasClass.on("resize", function (e) { return _this.onResize(); });
        this.colorUpdateTimer = 0;
        this.time = new Time();
        this.time.on("tick", function () { return _this.update(); });
        this.pointers.push(new Pointer(this.canvasClass.canvas));
        this.webGLContext = new WebGLContext({
            canvas: this.canvasClass.canvas,
            config: {
                simResolution: this.config.simResolution,
                dyeResolution: this.config.dyeResolution,
                bloomIterations: this.config.bloomIterations,
                sunraysResolution: this.config.sunraysResolution,
                bloomResolution: this.config.bloomResolution,
            },
        });
        this.gl = this.webGLContext.gl;
        this.texture = this.canvasClass.canvas;
        this.webGLContext.on("onResizeFBO", function (target) {
            return _this.onResizeFBO(target);
        });
        if (isMobile()) {
            this.config.dyeResolution = 512;
        }
        if (!this.webGLContext.ext.supportLinearFiltering) {
            this.config.dyeResolution = 512;
            this.config.shading = false;
            this.config.bloom = false;
            this.config.sunrays = false;
        }
        function isMobile() {
            return /Mobi|Android/i.test(navigator.userAgent);
        }
        this.blurProgram = new Program({
            webGLContext: this.webGLContext,
            vertexShader: new BlurVertexShader(this.webGLContext).shader,
            fragmentShader: new BlurShader(this.webGLContext).shader,
        });
        this.copyProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new CopyShader(this.webGLContext).shader,
        });
        this.clearProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new ClearShader(this.webGLContext).shader,
        });
        this.colorProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new ColorShader(this.webGLContext).shader,
        });
        this.bloomPrefilterProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new BloomPrefilterShader(this.webGLContext).shader,
        });
        this.bloomBlurProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new BloomBlurShader(this.webGLContext).shader,
        });
        this.bloomFinalProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new BloomFinalShader(this.webGLContext).shader,
        });
        this.sunraysMaskProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new SunRaysMaskShader(this.webGLContext).shader,
        });
        this.sunraysProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new SunraysShader(this.webGLContext).shader,
        });
        this.splatProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new SplatShader(this.webGLContext).shader,
        });
        this.advectionProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new AdvectionShader(this.webGLContext).shader,
        });
        this.divergenceProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new DivergenceShader(this.webGLContext).shader,
        });
        this.curlProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new CurlShader(this.webGLContext).shader,
        });
        this.vorticityProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new VorticityShader(this.webGLContext).shader,
        });
        this.pressureProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new PressureShader(this.webGLContext).shader,
        });
        this.gradienSubtractProgram = new Program({
            webGLContext: this.webGLContext,
            fragmentShader: new GradientSubtractShader(this.webGLContext).shader,
        });
        this.displayMaterial = new Material({
            webGLContext: this.webGLContext,
            vertexShader: new BaseVertexShader(this.webGLContext).shader,
            config: {
                shading: this.config.shading,
                bloom: this.config.bloom,
                sunrays: this.config.shading,
            },
        }); // EXTEND PROGRAM
        this.webGLContext.initFramebuffers();
        this.multipleSplats(Math.random() * 20 + 5);
        this.update();
    }
    FluidSimulation.prototype.multipleSplats = function (amount) {
        for (var i = 0; i < amount; i++) {
            var color = generateColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            var x = Math.random();
            var y = Math.random();
            var dx = 1000 * (Math.random() - 0.5);
            var dy = 1000 * (Math.random() - 0.5);
            this.splat(x, y, dx, dy, color);
        }
    };
    FluidSimulation.prototype.drawColor = function (target, color) {
        this.colorProgram.bind();
        this.gl.uniform4f(this.colorProgram.uniforms.color, color.r, color.g, color.b, 1);
        this.webGLContext.blit(target);
    };
    FluidSimulation.prototype.updateColors = function (dt) {
        if (!this.config.colorful)
            return;
        this.colorUpdateTimer += dt * this.config.colorUpdateSpeed;
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
            this.multipleSplats(this.splatStack.pop());
        this.pointers.forEach(function (p) {
            if (p.moved) {
                p.moved = false;
                _this.splatPointer(p);
            }
        });
    };
    FluidSimulation.prototype.splatPointer = function (pointer) {
        var dx = pointer.deltaX * this.config.splatForce;
        var dy = pointer.deltaY * this.config.splatForce;
        this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    };
    FluidSimulation.prototype.splat = function (x, y, dx, dy, color) {
        this.splatProgram.bind();
        this.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.webGLContext.velocity.read.attach(0));
        this.gl.uniform1f(this.splatProgram.uniforms.aspectRatio, this.canvasClass.width / this.canvasClass.height);
        this.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
        this.gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
        this.gl.uniform1f(this.splatProgram.uniforms.radius, this.correctRadius(this.config.splatRadius / 100.0));
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.webGLContext.dye.read.attach(0));
        this.gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
        this.webGLContext.blit(this.webGLContext.dye.write);
        this.webGLContext.dye.swap();
    };
    FluidSimulation.prototype.correctRadius = function (radius) {
        var aspectRatio = this.canvasClass.width / this.canvasClass.height;
        if (aspectRatio > 1)
            radius *= aspectRatio;
        return radius;
    };
    FluidSimulation.prototype.applyBloom = function (source, destination) {
        if (this.webGLContext.bloomFramebuffers.length < 2)
            return;
        var last = destination;
        this.gl.disable(this.gl.BLEND);
        this.bloomPrefilterProgram.bind();
        var knee = this.config.bloomThreshold * this.config.bloomSoftKnee + 0.0001;
        var curve0 = this.config.bloomThreshold - knee;
        var curve1 = knee * 2;
        var curve2 = 0.25 / knee;
        this.gl.uniform3f(this.bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
        this.gl.uniform1f(this.bloomPrefilterProgram.uniforms.threshold, this.config.bloomThreshold);
        this.gl.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
        this.webGLContext.blit(last);
        this.bloomBlurProgram.bind();
        for (var i = 0; i < this.webGLContext.bloomFramebuffers.length; i++) {
            var dest = this.webGLContext.bloomFramebuffers[i];
            this.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.webGLContext.blit(dest);
            last = dest;
        }
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);
        for (var i = this.webGLContext.bloomFramebuffers.length - 2; i >= 0; i--) {
            var baseTex = this.webGLContext.bloomFramebuffers[i];
            this.gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            this.gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0));
            this.gl.viewport(0, 0, baseTex.width, baseTex.height);
            this.webGLContext.blit(baseTex);
            last = baseTex;
        }
        this.gl.disable(this.gl.BLEND);
        this.bloomFinalProgram.bind();
        this.gl.uniform2f(this.bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        this.gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
        this.gl.uniform1f(this.bloomFinalProgram.uniforms.intensity, this.config.bloomIntensity);
        this.webGLContext.blit(destination);
    };
    FluidSimulation.prototype.applySunrays = function (source, mask, destination) {
        this.gl.disable(this.gl.BLEND);
        this.sunraysMaskProgram.bind();
        this.gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, source.attach(0));
        this.webGLContext.blit(mask);
        this.sunraysProgram.bind();
        this.gl.uniform1f(this.sunraysProgram.uniforms.weight, this.config.sunraysWeigth);
        this.gl.uniform1i(this.sunraysProgram.uniforms.uTexture, mask.attach(0));
        this.webGLContext.blit(destination);
    };
    FluidSimulation.prototype.blur = function (target, temp, iterations) {
        this.blurProgram.bind();
        for (var i = 0; i < iterations; i++) {
            this.gl.uniform2f(this.blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
            this.gl.uniform1i(this.blurProgram.uniforms.uTexture, target.attach(0));
            this.webGLContext.blit(temp);
            this.gl.uniform2f(this.blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
            this.gl.uniform1i(this.blurProgram.uniforms.uTexture, temp.attach(0));
            this.webGLContext.blit(target);
        }
    };
    FluidSimulation.prototype.step = function (dt) {
        this.gl.disable(this.gl.BLEND);
        this.curlProgram.bind();
        this.gl.uniform2f(this.curlProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.blit(this.webGLContext.curl);
        this.vorticityProgram.bind();
        this.gl.uniform2f(this.vorticityProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.webGLContext.curl.attach(1));
        this.gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.curl);
        this.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.divergenceProgram.bind();
        this.gl.uniform2f(this.divergenceProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.webGLContext.blit(this.webGLContext.divergence);
        this.clearProgram.bind();
        this.gl.uniform1i(this.clearProgram.uniforms.uTexture, this.webGLContext.pressure.read.attach(0));
        this.gl.uniform1f(this.clearProgram.uniforms.value, this.config.pressure);
        this.webGLContext.blit(this.webGLContext.pressure.write);
        this.webGLContext.pressure.swap();
        this.pressureProgram.bind();
        this.gl.uniform2f(this.pressureProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.webGLContext.divergence.attach(0));
        for (var i = 0; i < this.config.pressureIterations; i++) {
            this.gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.webGLContext.pressure.read.attach(1));
            this.webGLContext.blit(this.webGLContext.pressure.write);
            this.webGLContext.pressure.swap();
        }
        this.gradienSubtractProgram.bind();
        this.gl.uniform2f(this.gradienSubtractProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        this.gl.uniform1i(this.gradienSubtractProgram.uniforms.uPressure, this.webGLContext.pressure.read.attach(0));
        this.gl.uniform1i(this.gradienSubtractProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(1));
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        this.advectionProgram.bind();
        this.gl.uniform2f(this.advectionProgram.uniforms.texelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.webGLContext.velocity.texelSizeX, this.webGLContext.velocity.texelSizeY);
        var velocityId = this.webGLContext.velocity.read.attach(0);
        this.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
        this.gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
        this.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        this.gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.velocityDissipation);
        this.webGLContext.blit(this.webGLContext.velocity.write);
        this.webGLContext.velocity.swap();
        if (!this.webGLContext.ext.supportLinearFiltering)
            this.gl.uniform2f(this.advectionProgram.uniforms.dyeTexelSize, this.webGLContext.dye.texelSizeX, this.webGLContext.dye.texelSizeY);
        this.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.webGLContext.velocity.read.attach(0));
        this.gl.uniform1i(this.advectionProgram.uniforms.uSource, this.webGLContext.dye.read.attach(1));
        this.gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.densityDissipation);
        this.webGLContext.blit(this.webGLContext.dye.write);
        this.webGLContext.dye.swap();
    };
    FluidSimulation.prototype.drawDisplay = function (target) {
        var width = target == null ? this.gl.drawingBufferWidth : target.width;
        var height = target == null ? this.gl.drawingBufferHeight : target.height;
        this.displayMaterial.bind();
        if (this.config.shading)
            this.gl.uniform2f(this.displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
        this.gl.uniform1i(this.displayMaterial.uniforms.uTexture, this.webGLContext.dye.read.attach(0));
        if (this.config.bloom) {
            this.gl.uniform1i(this.displayMaterial.uniforms.uBloom, this.webGLContext.bloom.attach(1));
            this.gl.uniform1i(this.displayMaterial.uniforms.uDithering, this.displayMaterial.ditheringTexture.attach(2));
            var scale = this.getTextureScale(this.displayMaterial.ditheringTexture, width, height);
            this.gl.uniform2f(this.displayMaterial.uniforms.ditherScale, scale.x, scale.y);
        }
        if (this.config.sunrays)
            this.gl.uniform1i(this.displayMaterial.uniforms.uSunrays, this.webGLContext.sunrays.attach(3));
        this.webGLContext.blit(target);
    };
    FluidSimulation.prototype.getTextureScale = function (texture, width, height) {
        return {
            x: width / texture.width,
            y: height / texture.height,
        };
    };
    FluidSimulation.prototype.render = function (target) {
        if (this.config.bloom)
            this.applyBloom(this.webGLContext.dye.read, this.webGLContext.bloom);
        if (this.config.sunrays) {
            this.applySunrays(this.webGLContext.dye.read, this.webGLContext.dye.write, this.webGLContext.sunrays);
            this.blur(this.webGLContext.sunrays, this.webGLContext.sunraysTemp, 1);
        }
        if (target == null || !this.config.transparent) {
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
        }
        else {
            this.gl.disable(this.gl.BLEND);
        }
        if (target == null || !this.config.transparent) {
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
        }
        else {
            this.gl.disable(this.gl.BLEND);
        }
        if (!this.config.transparent)
            this.drawColor(target, normalizeColor(this.config.backGroundColor));
        this.drawDisplay(target);
    };
    FluidSimulation.prototype.update = function () {
        this.updateColors(this.time.delta);
        this.applyInputs();
        if (!this.config.paused)
            this.step(this.time.delta);
        this.render(null);
    };
    FluidSimulation.prototype.onResizeFBO = function (target) {
        this.copyProgram.bind();
        this.gl.uniform1i(this.copyProgram.uniforms.uTexture, target.attach(0));
    };
    //EVENTS
    FluidSimulation.prototype.onResize = function () {
        this.webGLContext.initFramebuffers();
    };
    FluidSimulation.prototype.mouseMove = function (e) {
        var pointer = this.pointers[0];
        if (!pointer.down && this.config.onlyHover == false)
            return;
        pointer.updatePointerMoveData(e.offsetX, e.offsetY);
    };
    FluidSimulation.prototype.mouseUp = function () {
        this.pointers[0].setPointerDown();
    };
    FluidSimulation.prototype.mouseDown = function (e) {
        var pointer = this.pointers.find(function (p) { return p.id == -1; });
        if (pointer == null)
            pointer = new Pointer(this.canvasClass.canvas);
        pointer.onTouchStart(-1, e.offsetX, e.offsetY);
        pointer.color = generateColor();
    };
    FluidSimulation.prototype.touchStart = function (e) {
        var touches = e.targetTouches;
        while (touches.length >= this.pointers.length)
            this.pointers.push(new Pointer(this.canvasClass.canvas));
        for (var i = 0; i < touches.length; i++) {
            this.pointers[i + 1].onTouchStart(touches[i].identifier, touches[i].pageX, touches[i].pageY);
            this.pointers[i + 1].color = generateColor();
        }
    };
    FluidSimulation.prototype.touchMove = function (e) {
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
            this.config.paused = !this.config.paused;
        if (e.key === " ")
            this.splatStack.push(Math.random() * 20 + 5);
    };
    return FluidSimulation;
}());
export default FluidSimulation;
