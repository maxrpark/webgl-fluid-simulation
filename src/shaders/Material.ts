import { hashCode } from "../utils/helperFunc.js";
import FluidSimulation, { config } from "../FluidSimulation.js";
import ShaderCompiler from "./ShaderCompiler.js";

const displayShaderSource = `
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

  setKeywords(keywords: string[]) {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

    let program: WebGLShader = this.programs[hash];

    if (program == null) {
      let fragmentShader = new ShaderCompiler(
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );

      program = this.createProgram(this.vertexShader, fragmentShader.shader);
      this.programs[hash] = program;
    }

    if (program == this.activeProgram) return;

    this.uniforms = this.getUniforms(program);
    this.activeProgram = program;
  }

  bind() {
    this.gl.useProgram(this.activeProgram);
  }

  createProgram(vertexShader: string, fragmentShader: string): WebGLShader {
    let program: WebGLProgram = this.gl.createProgram()!; // TODO
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
      console.trace(this.gl.getProgramInfoLog(program));

    return program;
  }

  getUniforms(program: WebGLProgram) {
    let uniforms: any = []; // TODO
    let uniformCount = this.gl.getProgramParameter(
      program,
      this.gl.ACTIVE_UNIFORMS
    );
    for (let i = 0; i < uniformCount; i++) {
      let uniformName = this.gl.getActiveUniform(program, i)!.name;
      uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  drawDisplay(target: any) {
    let width = target == null ? this.gl.drawingBufferWidth : target.width;
    let height = target == null ? this.gl.drawingBufferHeight : target.height;

    this.bind();
    if (config.SHADING)
      this.gl.uniform2f(this.uniforms.texelSize, 1.0 / width, 1.0 / height);

    this.gl.uniform1i(
      this.uniforms.uTexture,
      this.fluidSimulation.dye.read.attach(0)
    );

    if (config.BLOOM) {
      this.gl.uniform1i(
        this.uniforms.uBloom,
        this.fluidSimulation.bloom.attach(1)
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
        this.fluidSimulation.sunrays.attach(3)
      );

    this.fluidSimulation.blit(target);
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
}
