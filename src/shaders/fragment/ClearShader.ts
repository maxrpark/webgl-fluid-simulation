import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";

export default class ClearShader extends ShaderCompiler {
  constructor() {
    super(
      shaderType.FRAGMENT,
      `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`,
      null
    );
  }
}
