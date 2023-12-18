import { hashCode } from "../utils/helperFunc.js";
import FluidSimulation from "../FluidSimulation.js";
import ShaderCompiler from "./ShaderCompiler.js";
import config from "../utils/config.js";
import CreateProgram from "./CreateProgram.js";
const fragmentShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uSunrays;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

    #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
    #endif

    #ifdef SUNRAYS
        float sunrays = texture2D(uSunrays, vUv).r;
        c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
    #endif

    #ifdef BLOOM
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
    #endif

        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
    }
`;

export default class Material {
  fluidSimulation: FluidSimulation;
  gl: WebGL2RenderingContext;
  program: any;
  vertexShader: string;
  fragmentShaderSource: string;
  programs: WebGLShader[];
  activeProgram: any; // TODO
  uniforms: {
    texelSize: any;
    uTexture: any;
    uBloom: any;
    uDithering: any;
    ditherScale: any;
    uSunrays: any;
  };

  ditheringTexture: any;
  constructor(vertexShader: string) {
    this.fluidSimulation = new FluidSimulation();
    this.gl = this.fluidSimulation.webGLContext.gl;
    this.ditheringTexture = this.createTextureAsync(
      "package/assets/LDR_LLL1_0.png"
    );

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

  createFragmentShader(keywords: string[]) {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

    this.program = this.programs[hash];

    if (this.program == null) {
      let fragmentShader = new ShaderCompiler(
        this.gl.FRAGMENT_SHADER, // TODO
        this.fragmentShaderSource,
        keywords
      );

      this.program = new CreateProgram({
        gl: this.gl,
        vertexShader: this.vertexShader,
        fragmentShader: fragmentShader.shader,
      });

      this.programs[hash] = this.program.instance;
    }

    if (this.program == this.activeProgram) return;

    this.uniforms = this.program.uniforms;
    this.activeProgram = this.program.instance;
  }

  bind() {
    this.gl.useProgram(this.activeProgram);
  }

  drawDisplay(target: any) {
    let width = target == null ? this.gl.drawingBufferWidth : target.width;
    let height = target == null ? this.gl.drawingBufferHeight : target.height;

    this.bind();
    if (config.SHADING)
      this.gl.uniform2f(this.uniforms.texelSize, 1.0 / width, 1.0 / height);

    this.gl.uniform1i(
      this.uniforms.uTexture,
      this.fluidSimulation.webGLContext.dye.read.attach(0)
    );

    if (config.BLOOM) {
      this.gl.uniform1i(
        this.uniforms.uBloom,
        this.fluidSimulation.webGLContext.bloom.attach(1)
      );

      this.gl.uniform1i(
        this.uniforms.uDithering,
        this.ditheringTexture.attach(2)
      );
      let scale = this.getTextureScale(this.ditheringTexture, width, height);
      this.gl.uniform2f(this.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS)
      this.gl.uniform1i(
        this.uniforms.uSunrays,
        this.fluidSimulation.webGLContext.sunrays.attach(3)
      );

    this.fluidSimulation.webGLContext.blit(target); // TODO
  }

  getTextureScale(
    texture: {
      texture?: WebGLTexture | null;
      width: any;
      height: any;
      attach?: (id: number) => number;
    },
    width: number,
    height: number
  ) {
    return {
      x: width / texture.width,
      y: height / texture.height,
    };
  }

  createTextureAsync(url: string) {
    let texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.REPEAT
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB,
      1,
      1,
      0,
      this.gl.RGB,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255])
    );

    let gl = this.gl;

    let obj = {
      texture,
      width: 1,
      height: 1,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };

    let image = new Image();
    image.onload = () => {
      obj.width = image.width;
      obj.height = image.height;
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGB,
        this.gl.RGB,
        this.gl.UNSIGNED_BYTE,
        image
      );
    };
    image.src = url;

    return obj;
  }

  updateKeywords() {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    if (config.SUNRAYS) displayKeywords.push("SUNRAYS");

    this.createFragmentShader(displayKeywords);
  }
}
