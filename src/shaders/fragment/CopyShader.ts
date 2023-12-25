import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
import WebGLContext from "../../WebGLContext.js";

export default class CopyShader extends ShaderCompiler {
  constructor(webGLContext: WebGLContext) {
    super(
      webGLContext,
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
