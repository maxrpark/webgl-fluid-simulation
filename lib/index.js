import FluidSimulation from "./FluidSimulation.js";
new FluidSimulation({
    canvas: document.getElementsByTagName("canvas")[0],
    config: { className: "my-canvas" },
});
// new FluidSimulation({
//   config: { className: "my-canvas", canvasContainer: "container-canvas" },
// });
