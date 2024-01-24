import FluidSimulation from "./FluidSimulation.js";
import * as THREE from "three";
var canvas = document.createElement("canvas");
canvas.setAttribute("id", "webgl-canvas");
document.body.appendChild(canvas);
var fluid = new FluidSimulation({
    config: {
        isTexture: true,
        fluidColor: "#0000",
        transparent: true,
        curl: 0,
        pressure: 0.1,
    },
});
var texture = new THREE.CanvasTexture(fluid.texture);
console.log(texture);
texture.needsUpdate = true;
var sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};
// export const setScene = () => {
var scene = new THREE.Scene();
// CAMERA
var camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 100);
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enable = false;
camera.position.set(0, 0, 4);
scene.add(camera);
var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
});
var geometry = new THREE.BoxGeometry(2, 2, 2, 32, 32);
var mesh = new THREE.Mesh(geometry, material);
var mesh1 = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: "red",
}));
mesh1.position.set(1, 2, -2);
scene.add(mesh, mesh1);
var meshes = [mesh, mesh1];
// Renderer
var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
window.addEventListener("resize", function () {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});
var clock = new THREE.Clock();
var elapse = 0;
var tick = function () {
    elapse = clock.getDelta();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
    meshes.forEach(function (el) {
        el.rotation.x += 0.01;
        el.rotation.y -= 0.01;
    });
};
tick();
