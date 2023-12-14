import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";

export default class ColorShader extends ShaderCompiler {
  constructor() {
    super(
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
