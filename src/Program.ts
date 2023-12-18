import FluidSimulation from "./FluidSimulation.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";

interface Props {
  vertexShader: string | null;
  fragmentShader: string;
}
export default class Program {
  fluidSimulation: FluidSimulation;
  gl: WebGL2RenderingContext;
  vertexShader: any;

  uniforms: {
    uCurl(uCurl: any, arg1: any): unknown;
    curl(curl: any, CURL: number): unknown;
    dt(dt: any, dt1: number): unknown;
    value(value: any, PRESSURE: number): unknown;
    uDivergence(uDivergence: any, arg1: any): unknown;
    uPressure(uPressure: any, arg1: any): unknown;
    dyeTexelSize(dyeTexelSize: any, texelSizeX: any, texelSizeY: any): unknown;
    uSource(uSource: any, velocityId: any): unknown;
    dissipation(dissipation: any, VELOCITY_DISSIPATION: number): unknown;
    color(color: any, r: any, g: any, b: any, arg4: number): unknown;
    aspectRatio(aspectRatio: any, arg1: number): unknown;
    curve(curve: any, curve0: number, curve1: number, curve2: number): unknown;
    threshold(threshold: any, BLOOM_THRESHOLD: number): unknown;
    intensity(intensity: any, BLOOM_INTENSITY: number): unknown;
    weight(weight: any, SUNRAYS_WEIGHT: number): unknown;
    uTarget(uTarget: any, arg1: any): unknown;
    point(point: any, x: any, y: any): unknown;
    radius(radius: any, arg1: any): unknown;
    texelSize: any;
    uTexture: any;
    uVelocity: any;
  };
  program: WebGLProgram | null;
  constructor({ fragmentShader, vertexShader }: Props) {
    this.fluidSimulation = new FluidSimulation();
    this.gl = this.fluidSimulation.webGLContext.gl;

    this.vertexShader = vertexShader
      ? vertexShader
      : new BaseVertexShader().shader;

    this.uniforms = {
      uTexture: null,
      texelSize: null,
      uVelocity: null,
    };
    this.program = this.createProgram(this.vertexShader, fragmentShader);
    this.uniforms = this.getUniforms(this.program); // TODO
  }

  bind() {
    this.gl.useProgram(this.program);
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
}
