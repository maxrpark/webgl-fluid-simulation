import ShaderCompiler from "../ShaderCompiler.js";
import { shaderType } from "../../ts/global.js";

export default class BloomPrefilterShader extends ShaderCompiler {
  constructor() {
    super(
      shaderType.FRAGMENT,
      `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`,
      null
    );
  }
}
