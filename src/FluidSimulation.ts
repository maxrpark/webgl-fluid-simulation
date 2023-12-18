import Time from "./utils/Time.js";

import Material from "./shaders/Material.js";
import Program from "./Program.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";
import BlurVertexShader from "./shaders/vertex/BlurVertexShader.js";

import {
  BlurShader,
  CopyShader,
  GradientSubtractShader,
  PressureShader,
  VorticityShader,
  CurlShader,
  DivergenceShader,
  AdvectionShader,
  SplatShader,
  SunraysShader,
  SunRaysMaskShader,
  BloomFinalShader,
  BloomBlurShader,
  BloomPrefilterShader,
  ColorShader,
  ClearShader,
} from "./shaders/fragment/index.js";
import {
  generateColor,
  normalizeColor,
  scaleByPixelRatio,
  wrap,
} from "./utils/helperFunc.js";
import WebGLContext from "./WebGLContext.js";
import Canvas from "./Canvas.js";
import Pointer from "./Pointer.js";
import config from "./utils/config.js";

declare global {
  interface Window {
    fluidSimulation: FluidSimulation;
  }
}

export interface FluidSimulationInt {
  canvas?: HTMLCanvasElement | undefined;
}

let instance: FluidSimulation | null = null;

export default class FluidSimulation {
  canvas: Canvas;
  webGLContext: any;
  displayMaterial: Material;
  time: Time;

  colorUpdateTimer: number;

  pointers: Pointer[] = [];
  splatStack: any[] = [];

  // PROGRAMS
  blurProgram: Program;
  copyProgram: Program;
  clearProgram: Program;
  colorProgram: Program;
  bloomPrefilterProgram: Program;
  bloomBlurProgram: Program;
  bloomFinalProgram: Program;
  sunraysMaskProgram: Program;
  sunraysProgram: Program;
  splatProgram: Program;
  advectionProgram: Program;
  divergenceProgram: Program;
  curlProgram: Program;
  vorticityProgram: Program;
  pressureProgram: Program;
  gradienSubtractProgram: Program;

  constructor(canvas?: HTMLCanvasElement) {
    if (instance) {
      return instance;
    }

    instance = this;
    this.canvas = new Canvas(canvas!)!;
    this.colorUpdateTimer = 0;

    this.time = new Time();
    this.time.on("tick", () => this.update());

    this.pointers.push(new Pointer());

    this.canvas.on("mousemove", (e: Event) => this.mouseMove(e));
    this.canvas.on("mouseup", () => this.mouseUp());
    this.canvas.on("touchstart", (e: Event) => this.touchStart(e));
    this.canvas.on("touchmove", (e: Event) => this.touchMove(e));
    this.canvas.on("touchend", (e: Event) => this.touchEnd(e));
    this.canvas.on("keydown", (e: Event) => this.keyDown(e));
    this.canvas.on("resize", (e: Event) => this.onResize());

    this.webGLContext = new WebGLContext();

    if (isMobile()) {
      config.DYE_RESOLUTION = 512;
    }

    if (!this.webGLContext.ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 512;
      config.SHADING = false;
      config.BLOOM = false;
      config.SUNRAYS = false;
    }

    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }

    this.displayMaterial = new Material(new BaseVertexShader().shader); // EXTEND PROGRAM

    this.blurProgram = new Program({
      vertexShader: new BlurVertexShader().shader,
      fragmentShader: new BlurShader().shader,
    });
    this.copyProgram = new Program({
      fragmentShader: new CopyShader().shader,
    });
    this.clearProgram = new Program({
      fragmentShader: new ClearShader().shader,
    });
    this.colorProgram = new Program({
      fragmentShader: new ColorShader().shader,
    });

    this.bloomPrefilterProgram = new Program({
      fragmentShader: new BloomPrefilterShader().shader,
    });
    this.bloomBlurProgram = new Program({
      fragmentShader: new BloomBlurShader().shader,
    });
    this.bloomFinalProgram = new Program({
      fragmentShader: new BloomFinalShader().shader,
    });
    this.sunraysMaskProgram = new Program({
      fragmentShader: new SunRaysMaskShader().shader,
    });
    this.sunraysProgram = new Program({
      fragmentShader: new SunraysShader().shader,
    });
    this.splatProgram = new Program({
      fragmentShader: new SplatShader().shader,
    });
    this.advectionProgram = new Program({
      fragmentShader: new AdvectionShader().shader,
    });

    this.divergenceProgram = new Program({
      fragmentShader: new DivergenceShader().shader,
    });
    this.curlProgram = new Program({
      fragmentShader: new CurlShader().shader,
    });
    this.vorticityProgram = new Program({
      fragmentShader: new VorticityShader().shader,
    });
    this.pressureProgram = new Program({
      fragmentShader: new PressureShader().shader,
    });
    this.gradienSubtractProgram = new Program({
      fragmentShader: new GradientSubtractShader().shader,
    });

    this.webGLContext.initFramebuffers();

    const error = this.webGLContext.gl.getError();
    if (error !== this.webGLContext.gl.NO_ERROR) {
      console.error("WebGL error:", error);
    }

    const multipleSplats = (amount: number) => {
      for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        const x = Math.random();
        const y = Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        this.splat(x, y, dx, dy, color);
      }
    };
    multipleSplats(Math.random() * 20 + 5);

    // this.updateKeywords();
    this.update();
  }

  drawColor(target: any, color: any) {
    this.colorProgram.bind();
    this.webGLContext.gl.uniform4f(
      this.colorProgram.uniforms.color,
      color.r,
      color.g,
      color.b,
      1
    );
    this.webGLContext.blit(target);
  }

  render(target: any) {
    if (config.BLOOM)
      this.applyBloom(this.webGLContext.dye.read, this.webGLContext.bloom);
    if (config.SUNRAYS) {
      this.applySunrays(
        this.webGLContext.dye.read,
        this.webGLContext.dye.write,
        this.webGLContext.sunrays
      );
      this.blur(this.webGLContext.sunrays, this.webGLContext.sunraysTemp, 1);
    }

    if (target == null || !config.TRANSPARENT) {
      this.webGLContext.gl.blendFunc(
        this.webGLContext.gl.ONE,
        this.webGLContext.gl.ONE_MINUS_SRC_ALPHA
      );
      this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
    } else {
      this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    }

    if (target == null || !config.TRANSPARENT) {
      this.webGLContext.gl.blendFunc(
        this.webGLContext.gl.ONE,
        this.webGLContext.gl.ONE_MINUS_SRC_ALPHA
      );
      this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);
    } else {
      this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    }

    if (!config.TRANSPARENT)
      this.drawColor(target, normalizeColor(config.BACK_COLOR));

    this.displayMaterial.drawDisplay(target);
  }

  updateColors(dt: number) {
    if (!config.COLORFUL) return;

    this.colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);

      this.pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  applyInputs() {
    if (this.splatStack.length > 0) multipleSplats(this.splatStack.pop());

    this.pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    });
  }

  splatPointer(pointer: Pointer) {
    let dx = pointer.deltaX * config.SPLAT_FORCE;
    let dy = pointer.deltaY * config.SPLAT_FORCE;
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: { r: any; g: any; b: any; a?: number }
  ) {
    this.splatProgram.bind();

    this.webGLContext.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.webGLContext.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    this.webGLContext.gl.uniform3f(
      this.splatProgram.uniforms.color,
      dx,
      dy,
      0.0
    );
    this.webGLContext.gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.correctRadius(config.SPLAT_RADIUS / 100.0)
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();

    this.webGLContext.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.webGLContext.dye.read.attach(0)
    );
    this.webGLContext.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color.r,
      color.g,
      color.b
    );
    this.webGLContext.blit(this.webGLContext.dye.write);
    this.webGLContext.dye.swap();
  }

  correctRadius(radius: number) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  applyBloom(source, destination) {
    if (this.webGLContext.bloomFramebuffers.length < 2) return;

    let last = destination;

    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    this.bloomPrefilterProgram.bind();
    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    this.webGLContext.gl.uniform3f(
      this.bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2
    );
    this.webGLContext.gl.uniform1f(
      this.bloomPrefilterProgram.uniforms.threshold,
      config.BLOOM_THRESHOLD
    );
    this.webGLContext.gl.uniform1i(
      this.bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.webGLContext.blit(last);

    this.bloomBlurProgram.bind();
    for (let i = 0; i < this.webGLContext.bloomFramebuffers.length; i++) {
      let dest = this.webGLContext.bloomFramebuffers[i];
      this.webGLContext.gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      this.webGLContext.gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.webGLContext.blit(dest);
      last = dest;
    }

    this.webGLContext.gl.blendFunc(
      this.webGLContext.gl.ONE,
      this.webGLContext.gl.ONE
    );
    this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);

    for (let i = this.webGLContext.bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = this.webGLContext.bloomFramebuffers[i];
      this.webGLContext.gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      this.webGLContext.gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.webGLContext.gl.viewport(0, 0, baseTex.width, baseTex.height);
      this.webGLContext.blit(baseTex);
      last = baseTex;
    }

    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    this.bloomFinalProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.bloomFinalProgram.uniforms.uTexture,
      last.attach(0)
    );
    this.webGLContext.gl.uniform1f(
      this.bloomFinalProgram.uniforms.intensity,
      config.BLOOM_INTENSITY
    );
    this.webGLContext.blit(destination);
  }

  applySunrays(source, mask, destination) {
    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    this.sunraysMaskProgram.bind();
    this.webGLContext.gl.uniform1i(
      this.sunraysMaskProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.webGLContext.blit(mask);

    this.sunraysProgram.bind();
    this.webGLContext.gl.uniform1f(
      this.sunraysProgram.uniforms.weight,
      config.SUNRAYS_WEIGHT
    );
    this.webGLContext.gl.uniform1i(
      this.sunraysProgram.uniforms.uTexture,
      mask.attach(0)
    );
    this.webGLContext.blit(destination);
  }

  blur(target, temp, iterations: number) {
    this.blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
      this.webGLContext.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        target.texelSizeX,
        0.0
      );
      this.webGLContext.gl.uniform1i(
        this.blurProgram.uniforms.uTexture,
        target.attach(0)
      );
      this.webGLContext.blit(temp);

      this.webGLContext.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        0.0,
        target.texelSizeY
      );
      this.webGLContext.gl.uniform1i(
        this.blurProgram.uniforms.uTexture,
        temp.attach(0)
      );
      this.webGLContext.blit(target);
    }
  }

  step(dt: number) {
    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    this.curlProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.blit(this.webGLContext.curl);
    this.vorticityProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.vorticityProgram.uniforms.uCurl,
      this.webGLContext.curl.attach(1)
    );
    this.webGLContext.gl.uniform1f(
      this.vorticityProgram.uniforms.curl,
      config.CURL
    );
    this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    this.divergenceProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.blit(this.webGLContext.divergence);
    this.clearProgram.bind();
    this.webGLContext.gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.webGLContext.pressure.read.attach(0)
    );
    this.webGLContext.gl.uniform1f(
      this.clearProgram.uniforms.value,
      config.PRESSURE
    );
    this.webGLContext.blit(this.webGLContext.pressure.write);
    this.webGLContext.pressure.swap();
    this.pressureProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.webGLContext.divergence.attach(0)
    );
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      this.webGLContext.gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.webGLContext.pressure.read.attach(1)
      );
      this.webGLContext.blit(this.webGLContext.pressure.write);
      this.webGLContext.pressure.swap();
    }
    this.gradienSubtractProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.gradienSubtractProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uPressure,
      this.webGLContext.pressure.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(1)
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    this.advectionProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    if (!this.webGLContext.ext.supportLinearFiltering)
      this.webGLContext.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.webGLContext.velocity.texelSizeX,
        this.webGLContext.velocity.texelSizeY
      );
    let velocityId = this.webGLContext.velocity.read.attach(0);
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      velocityId
    );
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      velocityId
    );
    this.webGLContext.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    this.webGLContext.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      config.VELOCITY_DISSIPATION
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    if (!this.webGLContext.ext.supportLinearFiltering)
      this.webGLContext.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.webGLContext.dye.texelSizeX,
        this.webGLContext.dye.texelSizeY
      );
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.webGLContext.dye.read.attach(1)
    );
    this.webGLContext.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION
    );
    this.webGLContext.blit(this.webGLContext.dye.write);
    this.webGLContext.dye.swap();
  }

  update() {
    this.updateColors(this.time.delta);
    this.applyInputs();
    if (!config.PAUSED) this.step(this.time.delta);
    this.render(null);
  }

  onResize() {
    this.webGLContext.initFramebuffers();
  }

  //EVENTS

  mouseMove(e: MouseEvent) {
    let pointer = this.pointers[0];
    if (!pointer.down && config.ONLY_HOVER == false) return;

    pointer.updatePointerMoveData(e.offsetX, e.offsetY);
  }

  mouseUp() {
    this.pointers[0].setPointerDown();
  }

  touchStart(e: any) {
    e.preventDefault();
    const touches = e.targetTouches;
    while (touches.length >= this.pointers.length)
      this.pointers.push(new Pointer());
    for (let i = 0; i < touches.length; i++) {
      let posX = scaleByPixelRatio(touches[i].pageX);
      let posY = scaleByPixelRatio(touches[i].pageY);
      this.pointers[i + 1].onTouchStart(touches[i].identifier, posX, posY);
      this.pointers[i + 1].color = generateColor();
    }
  }

  touchMove(e: any) {
    e.preventDefault();
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
      let pointer = this.pointers[i + 1];

      if (!pointer.down) continue;
      pointer.updatePointerMoveData(touches[i].pageX, touches[i].pageY);
    }
  }

  touchEnd(e: any) {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      let pointer = this.pointers.find((p) => p.id == touches[i].identifier);
      if (pointer == null) continue;
      pointer.setPointerDown();
    }
  }

  keyDown(e: any) {
    if (e.code === "KeyP") config.PAUSED = !config.PAUSED;
    if (e.key === " ") this.splatStack.push(Math.random() * 20 + 5);
  }
}
