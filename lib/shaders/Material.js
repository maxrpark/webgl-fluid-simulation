import { hashCode } from "../utils/helperFunc.js";
import FluidSimulation from "../FluidSimulation.js";
import ShaderCompiler from "./ShaderCompiler.js";
import CreateProgram from "./CreateProgram.js";
import { shaderType } from "../ts/global.js";
var fragmentShader = "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform sampler2D uBloom;\n    uniform sampler2D uSunrays;\n    uniform sampler2D uDithering;\n    uniform vec2 ditherScale;\n    uniform vec2 texelSize;\n\n    vec3 linearToGamma (vec3 color) {\n        color = max(color, vec3(0));\n        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));\n    }\n\n    void main () {\n        vec3 c = texture2D(uTexture, vUv).rgb;\n\n    #ifdef shading\n        vec3 lc = texture2D(uTexture, vL).rgb;\n        vec3 rc = texture2D(uTexture, vR).rgb;\n        vec3 tc = texture2D(uTexture, vT).rgb;\n        vec3 bc = texture2D(uTexture, vB).rgb;\n\n        float dx = length(rc) - length(lc);\n        float dy = length(tc) - length(bc);\n\n        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n        vec3 l = vec3(0.0, 0.0, 1.0);\n\n        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n        c *= diffuse;\n    #endif\n\n    #ifdef BLOOM\n        vec3 bloom = texture2D(uBloom, vUv).rgb;\n    #endif\n\n    #ifdef SUNRAYS\n        float sunrays = texture2D(uSunrays, vUv).r;\n        c *= sunrays;\n    #ifdef BLOOM\n        bloom *= sunrays;\n    #endif\n    #endif\n\n    #ifdef BLOOM\n        float noise = texture2D(uDithering, vUv * ditherScale).r;\n        noise = noise * 2.0 - 1.0;\n        bloom += noise / 255.0;\n        bloom = linearToGamma(bloom);\n        c += bloom;\n    #endif\n\n        float a = max(c.r, max(c.g, c.b));\n        gl_FragColor = vec4(c, a);\n    }\n";
var Material = /** @class */ (function () {
    function Material(vertexShader) {
        this.fluidSimulation = new FluidSimulation({});
        this.gl = this.fluidSimulation.webGLContext.gl;
        this.ditheringTexture = this.createTextureAsync("package/assets/LDR_LLL1_0.png");
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShader;
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
        this.updateKeywords();
    }
    Material.prototype.createFragmentShader = function (keywords) {
        var hash = 0;
        for (var i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);
        this.program = this.programs[hash];
        if (this.program == null) {
            var fragmentShader_1 = new ShaderCompiler(shaderType.FRAGMENT, this.fragmentShaderSource, keywords);
            this.program = new CreateProgram({
                gl: this.gl,
                vertexShader: this.vertexShader,
                fragmentShader: fragmentShader_1.shader,
            });
            this.programs[hash] = this.program.instance;
        }
        if (this.program == this.activeProgram)
            return;
        this.uniforms = this.program.uniforms;
        this.activeProgram = this.program.instance;
    };
    Material.prototype.bind = function () {
        this.gl.useProgram(this.activeProgram);
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
    Material.prototype.updateKeywords = function () {
        var displayKeywords = [];
        if (this.fluidSimulation.config.shading)
            displayKeywords.push("shading");
        if (this.fluidSimulation.config.BLOOM)
            displayKeywords.push("BLOOM");
        if (this.fluidSimulation.config.SUNRAYS)
            displayKeywords.push("SUNRAYS");
        this.createFragmentShader(displayKeywords);
    };
    return Material;
}());
export default Material;
