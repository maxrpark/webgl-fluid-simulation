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
    texelSize: any;
    uTexture: any;
    uVelocity: any;
    uTarget: any;
    aspectRatio: any;
    point: any;
    radius: any;
    curve: any;
    threshold: any;
    intensity: any;

    uBloom: any;
    uDithering: any;
    ditherScale: any;
    uSunrays: any;
    color: any;
    weight: any;
    uCurl: any;
    curl: any;
    dt: any;
    value: any;
    uDivergence: any;

    uPressure: any;
    dyeTexelSize: any;

    uSource: any;
    dissipation: any;
  };
  program: WebGLProgram | null;
  constructor({ fragmentShader, vertexShader }: Props) {
    this.fluidSimulation = new FluidSimulation();
    this.gl = this.fluidSimulation.webGLContext.gl;
    this.uniforms = {
      texelSize: null,
      uTexture: null,
      uVelocity: null,
      uTarget: null,
      aspectRatio: null,
      point: null,
      radius: null,
      curve: null,
      threshold: null,
      intensity: null,

      uBloom: null,
      uDithering: null,
      ditherScale: null,
      uSunrays: null,
      color: null,
      weight: null,
      uCurl: null,
      curl: null,
      dt: null,
      value: null,
      uDivergence: null,

      uPressure: null,
      dyeTexelSize: null,

      uSource: null,
      dissipation: null,
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
