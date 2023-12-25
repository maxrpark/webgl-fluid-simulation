import WebGLContext from "../WebGLContext.js";
import BaseVertexShader from "./vertex/baseVertexShader.js";

interface Props {
  webGLContext: WebGLContext;
  vertexShader?: string;
  fragmentShader: string;
}
export default class CreateProgram {
  instance: WebGLShader;
  webGLContext: WebGLContext;
  gl: WebGL2RenderingContext;
  uniforms: any;
  vertexShader: string;

  constructor({ webGLContext, vertexShader, fragmentShader }: Props) {
    this.webGLContext = webGLContext;
    this.gl = this.webGLContext.gl;

    this.vertexShader = vertexShader
      ? vertexShader
      : new BaseVertexShader(this.webGLContext).shader;

    this.createProgram(this.vertexShader, fragmentShader);
    this.getUniforms(this.instance);
  }

  createProgram(vertexShader: string, fragmentShader: string) {
    let program: WebGLProgram = this.gl.createProgram()!; // TODO

    this.gl.attachShader(program, this.vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
      console.trace(this.gl.getProgramInfoLog(program));

    this.instance = program;
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
    this.uniforms = uniforms;
  }
}
