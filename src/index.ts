import FluidSimulation from "./FluidSimulation.js";

new FluidSimulation({
  canvas: document.getElementsByTagName("canvas")[0],
  config: { transparent: true },
});
