import FluidSimulation from "../FluidSimulation.js";
import { shaderType } from "../ts/global.js";

export default class ShaderCompiler {
  shader: any;
  fluidSimulation: FluidSimulation;
  gl: WebGL2RenderingContext;

  constructor(
    type: shaderType,
    sourceShader: string,
    keywords: string[] | null
  ) {
    this.fluidSimulation = new FluidSimulation({});
    this.gl = this.fluidSimulation.webGLContext.gl;

    let k = keywords?.length
      ? this.fluidSimulation.webGLContext.ext.supportLinearFiltering
        ? null
        : ["MANUAL_FILTERING"]
      : [];

    const source = this.addKeywords(sourceShader, k);

    this.shader = this.gl.createShader(
      type === shaderType.VERTEX
        ? this.gl.VERTEX_SHADER
        : this.gl.FRAGMENT_SHADER
    );

    if (!this.shader) {
      throw new Error();
    }
    this.gl.shaderSource(this.shader, source);
    this.gl.compileShader(this.shader);

    if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS))
      console.trace(this.gl.getShaderInfoLog(this.shader));
  }
  addKeywords(source: string, keywords: string[] | null): string {
    if (keywords == null) return source;

    let keywordsString = "";
    keywords.forEach((keyword) => {
      keywordsString += "#define " + keyword + "\n";
    });
    return keywordsString + source;
  }
}
