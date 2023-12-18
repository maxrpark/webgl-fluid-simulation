import FluidSimulation from "./FluidSimulation.js";
import CreateProgram from "./shaders/CreateProgram.js";

interface Props {
  vertexShader?: string;
  fragmentShader: string;
}
export default class Program {
  fluidSimulation: FluidSimulation;
  gl: WebGL2RenderingContext;
  vertexShader: any;

  uniforms: {
    // uCurl(uCurl: any, arg1: any): unknown;
    // curl(curl: any, CURL: number): unknown;
    // dt(dt: any, dt1: number): unknown;
    // value(value: any, PRESSURE: number): unknown;
    // uDivergence(uDivergence: any, arg1: any): unknown;
    // uPressure(uPressure: any, arg1: any): unknown;
    // dyeTexelSize(dyeTexelSize: any, texelSizeX: any, texelSizeY: any): unknown;
    // uSource(uSource: any, velocityId: any): unknown;
    // dissipation(dissipation: any, VELOCITY_DISSIPATION: number): unknown;
    // color(color: any, r: any, g: any, b: any, arg4: number): unknown;
    // aspectRatio(aspectRatio: any, arg1: number): unknown;
    // curve(curve: any, curve0: number, curve1: number, curve2: number): unknown;
    // threshold(threshold: any, BLOOM_THRESHOLD: number): unknown;
    // intensity(intensity: any, BLOOM_INTENSITY: number): unknown;
    // weight(weight: any, SUNRAYS_WEIGHT: number): unknown;
    // uTarget(uTarget: any, arg1: any): unknown;
    // point(point: any, x: any, y: any): unknown;
    // radius(radius: any, arg1: any): unknown;
    texelSize: any;
    uTexture: any;
    uVelocity: any;

    uBloom: any;
    uDithering: any;
    ditherScale: any;
    uSunrays: any;
  };
  program: WebGLProgram | null;
  constructor({ fragmentShader, vertexShader }: Props) {
    this.fluidSimulation = new FluidSimulation();
    this.gl = this.fluidSimulation.webGLContext.gl;
    this.uniforms = {
      uTexture: null,
      texelSize: null,
      uVelocity: null,
      uBloom: null,
      uDithering: null,
      ditherScale: null,
      uSunrays: null,
    };

    const newProgram = new CreateProgram({
      gl: this.gl,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.program = newProgram.instance;
    this.uniforms = newProgram.uniforms; // TODO
  }

  bind() {
    this.gl.useProgram(this.program);
  }
}
