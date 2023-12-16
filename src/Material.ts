import config from "./utils/config.js";

export default class Material {
  vertexShader: string;
  fragmentShaderSource: string;
  programs: [];
  activeProgram: any; // TODO
  uniforms: {
    texelSize: any;
    uTexture: any;
    uBloom: any;
    uDithering: any;
    ditherScale: any;
    uSunrays: any;
  };
  constructor(vertexShader: string, fragmentShaderSource: string) {
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
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

    let program = this.programs[hash];
    if (program == null) {
      let fragmentShader = compileShader(
        gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );
      program = createProgram(this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }

    if (program == this.activeProgram) return;

    this.uniforms = getUniforms(program);
    this.activeProgram = program;
  }

  bind() {
    gl.useProgram(this.activeProgram);
  }
}
