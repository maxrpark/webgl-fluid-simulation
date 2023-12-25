import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";
import WebGLContext from "../../WebGLContext.js";

export default class SplatShader extends ShaderCompiler {
  constructor(webGLContext: WebGLContext) {
    super(
      webGLContext,
      shaderType.FRAGMENT,
      `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`,
      null
    );
  }
}
