import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
import WebGLContext from "../../WebGLContext.js";

export default class BlurShader extends ShaderCompiler {
  constructor(webGLContext: WebGLContext) {
    super(
      webGLContext,
      shaderType.FRAGMENT,
      `
       precision mediump float;
       precision mediump sampler2D;

       varying vec2 vUv;
       varying vec2 vL;
       varying vec2 vR;
       uniform sampler2D uTexture;

       void main () {
           vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
           sum += texture2D(uTexture, vL) * 0.35294117;
           sum += texture2D(uTexture, vR) * 0.35294117;
           gl_FragColor = sum;
       }
`,
      null
    );
  }
}
