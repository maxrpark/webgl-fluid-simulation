import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";

export default class CopyShader extends ShaderCompiler {
  constructor() {
    super(
      shaderType.FRAGMENT,
      `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`,
      null
    );
  }
}
