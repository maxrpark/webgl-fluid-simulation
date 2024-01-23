import FluidSimulation from "./FluidSimulation.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// new FluidSimulation({
//   // pass canvas or create new one
//   config: { className: "my-canvas" },
// });

const canvas = document.createElement("canvas");
canvas.setAttribute("id", "webgl-canvas");
document.body.appendChild(canvas);

let fluid = new FluidSimulation({
  config: {
    // isTexture: true,
    // className: "my-canvas",
    // canvasContainer: "container-canvas",
    transparent: false,
    backGroundColor: "#353535",
  },
});

// const texture = new THREE.CanvasTexture(fluid.texture);

// texture.needsUpdate = true;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// export const setScene = () => {
const scene = new THREE.Scene();

// CAMERA

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.01,
  100
);

// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enable = false;

camera.position.set(0, 0, 4);
scene.add(camera);
const material = new THREE.MeshBasicMaterial({
  // map: texture,
  transparent: true,
});

const geometry = new THREE.BoxGeometry(2, 2, 2, 32, 32);
const mesh = new THREE.Mesh(geometry, material);
const mesh1 = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({
    color: "red",
  })
);
mesh1.position.set(1, 2, -2);
scene.add(mesh, mesh1);

const meshes = [mesh, mesh1];

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const clock = new THREE.Clock();
let elapse = 0;
const tick = () => {
  elapse = clock.getDelta();
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
  // texture.needsUpdate = true;

  // controls.update();

  meshes.forEach((el) => {
    el.rotation.x += 0.01;
    el.rotation.y -= 0.01;
  });
};

tick();
