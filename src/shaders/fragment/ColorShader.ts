import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
import WebGLContext from "../../WebGLContext.js";

export default class ColorShader extends ShaderCompiler {
  constructor(webGLContext: WebGLContext) {
    super(
      webGLContext,
      shaderType.FRAGMENT,
      `
     precision mediump float;

     uniform vec4 color;

     void main () {
         gl_FragColor = color;
     }
`,
      null
    );
  }
}
