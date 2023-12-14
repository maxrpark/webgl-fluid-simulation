import { hashCode } from "../utils/helperFunc.js";
import FluidSimulation, { config } from "../FluidSimulation.js";
import ShaderCompiler from "./ShaderCompiler.js";
var displayShaderSource = "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform sampler2D uBloom;\n    uniform sampler2D uSunrays;\n    uniform sampler2D uDithering;\n    uniform vec2 ditherScale;\n    uniform vec2 texelSize;\n\n    vec3 linearToGamma (vec3 color) {\n        color = max(color, vec3(0));\n        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));\n    }\n\n    void main () {\n        vec3 c = texture2D(uTexture, vUv).rgb;\n\n    #ifdef SHADING\n        vec3 lc = texture2D(uTexture, vL).rgb;\n        vec3 rc = texture2D(uTexture, vR).rgb;\n        vec3 tc = texture2D(uTexture, vT).rgb;\n        vec3 bc = texture2D(uTexture, vB).rgb;\n\n        float dx = length(rc) - length(lc);\n        float dy = length(tc) - length(bc);\n\n        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n        vec3 l = vec3(0.0, 0.0, 1.0);\n\n        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n        c *= diffuse;\n    #endif\n\n    #ifdef BLOOM\n        vec3 bloom = texture2D(uBloom, vUv).rgb;\n    #endif\n\n    #ifdef SUNRAYS\n        float sunrays = texture2D(uSunrays, vUv).r;\n        c *= sunrays;\n    #ifdef BLOOM\n        bloom *= sunrays;\n    #endif\n    #endif\n\n    #ifdef BLOOM\n        float noise = texture2D(uDithering, vUv * ditherScale).r;\n        noise = noise * 2.0 - 1.0;\n        bloom += noise / 255.0;\n        bloom = linearToGamma(bloom);\n        c += bloom;\n    #endif\n\n        float a = max(c.r, max(c.g, c.b));\n        gl_FragColor = vec4(c, a);\n    }\n";
var Material = /** @class */ (function () {
    function Material(vertexShader) {
        this.fluidSimulation = new FluidSimulation();
        this.gl = this.fluidSimulation.webGLContext.gl;
        this.ditheringTexture = this.createTextureAsync("LDR_LLL1_0.png"); // TODO
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = displayShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = {
            texelSize: null,
            uTexture: null,
            uBloom: null,
            uDithering: null,
            ditherScale: null,
            uSunrays: null,
        };
    }
    Material.prototype.setKeywords = function (keywords) {
        var hash = 0;
        for (var i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);
        var program = this.programs[hash];
        if (program == null) {
            var fragmentShader = new ShaderCompiler(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = this.createProgram(this.vertexShader, fragmentShader.shader);
            this.programs[hash] = program;
        }
        if (program == this.activeProgram)
            return;
        this.uniforms = this.getUniforms(program);
        this.activeProgram = program;
    };
    Material.prototype.bind = function () {
        this.gl.useProgram(this.activeProgram);
    };
    Material.prototype.createProgram = function (vertexShader, fragmentShader) {
        var program = this.gl.createProgram(); // TODO
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
            console.trace(this.gl.getProgramInfoLog(program));
        return program;
    };
    Material.prototype.getUniforms = function (program) {
        var uniforms = []; // TODO
        var uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < uniformCount; i++) {
            var uniformName = this.gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    };
    Material.prototype.drawDisplay = function (target) {
        var width = target == null ? this.gl.drawingBufferWidth : target.width;
        var height = target == null ? this.gl.drawingBufferHeight : target.height;
        this.bind();
        if (config.SHADING)
            this.gl.uniform2f(this.uniforms.texelSize, 1.0 / width, 1.0 / height);
        this.gl.uniform1i(this.uniforms.uTexture, this.fluidSimulation.dye.read.attach(0));
        if (config.BLOOM) {
            this.gl.uniform1i(this.uniforms.uBloom, this.fluidSimulation.bloom.attach(1));
            this.gl.uniform1i(this.uniforms.uDithering, this.ditheringTexture.attach(2));
            var scale = this.getTextureScale(this.ditheringTexture, width, height);
            this.gl.uniform2f(this.uniforms.ditherScale, scale.x, scale.y);
        }
        if (config.SUNRAYS)
            this.gl.uniform1i(this.uniforms.uSunrays, this.fluidSimulation.sunrays.attach(3));
        this.fluidSimulation.blit(target);
    };
    Material.prototype.getTextureScale = function (texture, width, height) {
        return {
            x: width / texture.width,
            y: height / texture.height,
        };
    };
    Material.prototype.createTextureAsync = function (url) {
        var _this = this;
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 1, 1, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));
        var gl = this.gl;
        var obj = {
            texture: texture,
            width: 1,
            height: 1,
            attach: function (id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
        var image = new Image();
        image.onload = function () {
            obj.width = image.width;
            obj.height = image.height;
            _this.gl.bindTexture(_this.gl.TEXTURE_2D, texture);
            _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGB, _this.gl.RGB, _this.gl.UNSIGNED_BYTE, image);
        };
        image.src = url;
        return obj;
    };
    return Material;
}());
export default Material;
