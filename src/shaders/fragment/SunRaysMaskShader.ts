import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
import Program from "../../Program.js";
import WebGLContext from "../../WebGLContext.js";

export default class SunRaysMaskShader extends ShaderCompiler {
  constructor(webGLContext: WebGLContext) {
    super(
      webGLContext,
      shaderType.FRAGMENT,
      `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec4 c = texture2D(uTexture, vUv);
        float br = max(c.r, max(c.g, c.b));
        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
        gl_FragColor = c;
    }
`,
      null
    );
  }
}
