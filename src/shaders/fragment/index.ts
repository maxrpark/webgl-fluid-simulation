import BlurShader from "./BlurShader.js";
import CopyShader from "./CopyShader.js";
import GradientSubtractShader from "./GradientSubtractShader.js";
import PressureShader from "./PressureShader.js";
import VorticityShader from "./VorticityShader.js";
import CurlShader from "./CurlShader.js";
import DivergenceShader from "./DivergenceShader.js";
import AdvectionShader from "./AdvectionShader.js";
import SplatShader from "./SplatShader.js";
import SunraysShader from "./SunraysShader.js";
import SunRaysMaskShader from "./SunRaysMaskShader.js";
import BloomFinalShader from "./bloomFinalShader.js";
import BloomBlurShader from "./BloomBlurShader.js";
import BloomPrefilterShader from "./BloomPrefilterShader.js";
import CheckerboardShader from "./CheckerboardShader.js";
import ColorShader from "./ColorShader.js";
import ClearShader from "./ClearShader.js";

const blurShader = new BlurShader();
const copyShader = new CopyShader();
const clearShader = new ClearShader();
const colorShader = new ColorShader();
const checkerboardShader = new CheckerboardShader();
const bloomPrefilterShader = new BloomPrefilterShader();
const bloomBlurShader = new BloomBlurShader();
const bloomFinalShader = new BloomFinalShader();
const sunraysMaskShader = new SunRaysMaskShader();
const sunraysShader = new SunraysShader();
const splatShader = new SplatShader();
const advectionShader = new AdvectionShader();
const divergenceShader = new DivergenceShader();
const curlShader = new CurlShader();
const vorticityShader = new VorticityShader();
const pressureShader = new PressureShader();
const gradientSubtractShader = new GradientSubtractShader();

export {
  checkerboardShader,
  bloomPrefilterShader,
  clearShader,
  bloomBlurShader,
  blurShader,
  copyShader,
  colorShader,
  sunraysMaskShader,
  gradientSubtractShader,
  pressureShader,
  vorticityShader,
  curlShader,
  divergenceShader,
  advectionShader,
  splatShader,
  sunraysShader,
  bloomFinalShader,
};
