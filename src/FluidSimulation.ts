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
  uuid,
  wrap,
} from "./utils/helperFunc.js";
import WebGLContext from "./WebGLContext.js";
import Canvas from "./Canvas.js";
import Pointer from "./Pointer.js";
import { FramebufferObject } from "./FramebufferObject.js";

interface configInt {
  simResolution: number;
  dyeResolution: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressure: number;
  pressureIterations: number;
  curl: number;
  splatRadius: number;
  splatForce: number;
  shading: boolean;
  colorful: boolean;
  colorUpdateSpeed: number;
  paused: boolean;
  blackColor: { r: number; g: number; b: number };
  transparent: boolean;
  bloom: boolean;
  bloomIterations: number;
  bloomResolution: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSoftKnee: number;
  sunrays: boolean;
  sunraysResolution: number;
  sunraysWeigth: number;
  onlyHover: boolean;
  canvasContainer: string;
  className: string;
}

interface Props {
  canvas?: HTMLCanvasElement;
  config?: {
    simResolution?: number;
    dyeResolution?: number;
    densityDissipation?: number;
    velocityDissipation?: number;
    pressure?: number;
    pressureIterations?: number;
    curl?: number;
    splatRadius?: number;
    splatForce?: number;
    shading?: boolean;
    colorful?: boolean;
    colorUpdateSpeed?: number;
    paused?: boolean;
    blackColor?: { r?: number; g?: number; b?: number };
    transparent?: boolean;
    bloom?: boolean;
    bloomIterations?: number;
    bloomResolution?: number;
    bloomIntensity?: number;
    bloomThreshold?: number;
    bloomSoftKnee?: number;
    sunrays?: boolean;
    sunraysResolution?: number;
    sunraysWeigth?: number;
    onlyHover?: boolean;
    className?: string;
    canvasContainer?: any;
  };
}

export interface FluidSimulationInt {
  canvas?: HTMLCanvasElement | undefined;
}

export default class FluidSimulation {
  canvas?: HTMLCanvasElement;
  uuid: string;
  canvasClass: Canvas;
  webGLContext: WebGLContext;
  gl: WebGL2RenderingContext;
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

  config: configInt = {
    simResolution: 128,
    dyeResolution: 1024,

    densityDissipation: 1,
    velocityDissipation: 0.2,
    pressure: 0.8,
    pressureIterations: 20,
    curl: 30,
    splatRadius: 0.25,
    splatForce: 6000,
    shading: true,
    colorful: true,
    colorUpdateSpeed: 10,
    paused: false,
    blackColor: { r: 0, g: 0, b: 0 },
    transparent: false,
    bloom: false,
    bloomIterations: 8,
    bloomResolution: 256,
    bloomIntensity: 0.8,
    bloomThreshold: 0.6,
    bloomSoftKnee: 0.7,
    sunrays: false,
    sunraysResolution: 196,
    sunraysWeigth: 1.0,
    onlyHover: true,
    className: "",
    canvasContainer: "",
  };

  constructor(props: Props) {
    this.uuid = uuid();
    let configProps = props.config as configInt;
    this.config = { ...this.config, ...configProps };

    this.canvasClass = new Canvas(
      this.config.className,
      this.config.canvasContainer
    );
    this.canvasClass.on("mousedown", (e: MouseEvent) => this.mouseDown(e));
    this.canvasClass.on("mousemove", (e: MouseEvent) => this.mouseMove(e));
    this.canvasClass.on("mouseup", () => this.mouseUp());
    this.canvasClass.on("touchstart", (e: MouseEvent) => this.touchStart(e));
    this.canvasClass.on("touchmove", (e: MouseEvent) => this.touchMove(e));
    this.canvasClass.on("touchend", (e: MouseEvent) => this.touchEnd(e));
    this.canvasClass.on("keydown", (e: MouseEvent) => this.keyDown(e));
    this.canvasClass.on("resize", (e: MouseEvent) => this.onResize());

    this.colorUpdateTimer = 0;

    this.time = new Time();
    this.time.on("tick", () => this.update());

    this.pointers.push(new Pointer(this.canvasClass.canvas));
    this.webGLContext = new WebGLContext({
      canvas: this.canvasClass.canvas,
      config: {
        simResolution: this.config.simResolution,
        dyeResolution: this.config.dyeResolution,
        bloomIterations: this.config.bloomIterations,
        sunraysResolution: this.config.sunraysResolution,
        bloomResolution: this.config.bloomResolution,
      },
    });
    this.gl = this.webGLContext.gl;

    this.webGLContext.on("onResizeFBO", (target: FramebufferObject) =>
      this.onResizeFBO(target)
    );

    if (isMobile()) {
      this.config.dyeResolution = 512;
    }

    if (!this.webGLContext.ext.supportLinearFiltering) {
      this.config.dyeResolution = 512;
      this.config.shading = false;
      this.config.bloom = false;
      this.config.sunrays = false;
    }

    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }

    this.blurProgram = new Program({
      webGLContext: this.webGLContext,
      vertexShader: new BlurVertexShader(this.webGLContext).shader,
      fragmentShader: new BlurShader(this.webGLContext).shader,
    });
    this.copyProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new CopyShader(this.webGLContext).shader,
    });
    this.clearProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new ClearShader(this.webGLContext).shader,
    });
    this.colorProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new ColorShader(this.webGLContext).shader,
    });

    this.bloomPrefilterProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new BloomPrefilterShader(this.webGLContext).shader,
    });
    this.bloomBlurProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new BloomBlurShader(this.webGLContext).shader,
    });
    this.bloomFinalProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new BloomFinalShader(this.webGLContext).shader,
    });
    this.sunraysMaskProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new SunRaysMaskShader(this.webGLContext).shader,
    });
    this.sunraysProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new SunraysShader(this.webGLContext).shader,
    });
    this.splatProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new SplatShader(this.webGLContext).shader,
    });
    this.advectionProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new AdvectionShader(this.webGLContext).shader,
    });

    this.divergenceProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new DivergenceShader(this.webGLContext).shader,
    });
    this.curlProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new CurlShader(this.webGLContext).shader,
    });
    this.vorticityProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new VorticityShader(this.webGLContext).shader,
    });
    this.pressureProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new PressureShader(this.webGLContext).shader,
    });
    this.gradienSubtractProgram = new Program({
      webGLContext: this.webGLContext,
      fragmentShader: new GradientSubtractShader(this.webGLContext).shader,
    });

    this.displayMaterial = new Material({
      webGLContext: this.webGLContext,
      vertexShader: new BaseVertexShader(this.webGLContext).shader,
      config: {
        shading: this.config.shading,
        bloom: this.config.bloom,
        sunrays: this.config.shading,
      },
    }); // EXTEND PROGRAM

    this.webGLContext.initFramebuffers();

    this.multipleSplats(Math.random() * 20 + 5);
    this.update();
  }

  multipleSplats(amount: number) {
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
  }
  drawColor(target: any, color: any) {
    this.colorProgram.bind();
    this.gl.uniform4f(
      this.colorProgram.uniforms.color,
      color.r,
      color.g,
      color.b,
      1
    );
    this.webGLContext.blit(target);
  }

  updateColors(dt: number) {
    if (!this.config.colorful) return;

    this.colorUpdateTimer += dt * this.config.colorUpdateSpeed;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);

      this.pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  applyInputs() {
    if (this.splatStack.length > 0) this.multipleSplats(this.splatStack.pop());

    this.pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    });
  }

  splatPointer(pointer: Pointer) {
    let dx = pointer.deltaX * this.config.splatForce;
    let dy = pointer.deltaY * this.config.splatForce;
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

    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.webGLContext.velocity.read.attach(0)
    );
    this.gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvasClass.width / this.canvasClass.height
    );
    this.gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    this.gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
    this.gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.correctRadius(this.config.splatRadius / 100.0)
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();

    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.webGLContext.dye.read.attach(0)
    );
    this.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color.r,
      color.g,
      color.b
    );
    this.webGLContext.blit(this.webGLContext.dye.write);
    this.webGLContext.dye.swap();
  }

  correctRadius(radius: number) {
    let aspectRatio = this.canvasClass.width / this.canvasClass.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  applyBloom(source: any, destination: any) {
    if (this.webGLContext.bloomFramebuffers.length < 2) return;

    let last = destination;

    this.gl.disable(this.gl.BLEND);
    this.bloomPrefilterProgram.bind();

    let knee = this.config.bloomThreshold * this.config.bloomSoftKnee + 0.0001;
    let curve0 = this.config.bloomThreshold - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;

    this.gl.uniform3f(
      this.bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2
    );
    this.gl.uniform1f(
      this.bloomPrefilterProgram.uniforms.threshold,
      this.config.bloomThreshold
    );
    this.gl.uniform1i(
      this.bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.webGLContext.blit(last);

    this.bloomBlurProgram.bind();

    for (let i = 0; i < this.webGLContext.bloomFramebuffers.length; i++) {
      let dest = this.webGLContext.bloomFramebuffers[i];
      this.gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      this.gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.webGLContext.blit(dest);

      last = dest;
    }

    this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
    this.gl.enable(this.gl.BLEND);

    for (let i = this.webGLContext.bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = this.webGLContext.bloomFramebuffers[i];

      this.gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      this.gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.gl.viewport(0, 0, baseTex.width, baseTex.height);
      this.webGLContext.blit(baseTex);
      last = baseTex;
    }

    this.gl.disable(this.gl.BLEND);
    this.bloomFinalProgram.bind();
    this.gl.uniform2f(
      this.bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY
    );
    this.gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0));
    this.gl.uniform1f(
      this.bloomFinalProgram.uniforms.intensity,
      this.config.bloomIntensity
    );

    this.webGLContext.blit(destination);
  }

  applySunrays(source: any, mask: any, destination: any) {
    this.gl.disable(this.gl.BLEND);
    this.sunraysMaskProgram.bind();
    this.gl.uniform1i(
      this.sunraysMaskProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.webGLContext.blit(mask);

    this.sunraysProgram.bind();
    this.gl.uniform1f(
      this.sunraysProgram.uniforms.weight,
      this.config.sunraysWeigth
    );
    this.gl.uniform1i(this.sunraysProgram.uniforms.uTexture, mask.attach(0));
    this.webGLContext.blit(destination);
  }

  blur(target: any, temp: any, iterations: number) {
    this.blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
      this.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        target.texelSizeX,
        0.0
      );
      this.gl.uniform1i(this.blurProgram.uniforms.uTexture, target.attach(0));
      this.webGLContext.blit(temp);

      this.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        0.0,
        target.texelSizeY
      );
      this.gl.uniform1i(this.blurProgram.uniforms.uTexture, temp.attach(0));
      this.webGLContext.blit(target);
    }
  }

  step(dt: number) {
    this.gl.disable(this.gl.BLEND);
    this.curlProgram.bind();
    this.gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.blit(this.webGLContext.curl);
    this.vorticityProgram.bind();
    this.gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.gl.uniform1i(
      this.vorticityProgram.uniforms.uCurl,
      this.webGLContext.curl.attach(1)
    );
    this.gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.curl);
    this.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    this.divergenceProgram.bind();
    this.gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.webGLContext.blit(this.webGLContext.divergence);
    this.clearProgram.bind();
    this.gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.webGLContext.pressure.read.attach(0)
    );
    this.gl.uniform1f(this.clearProgram.uniforms.value, this.config.pressure);
    this.webGLContext.blit(this.webGLContext.pressure.write);
    this.webGLContext.pressure.swap();
    this.pressureProgram.bind();
    this.gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.webGLContext.divergence.attach(0)
    );
    for (let i = 0; i < this.config.pressureIterations; i++) {
      this.gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.webGLContext.pressure.read.attach(1)
      );
      this.webGLContext.blit(this.webGLContext.pressure.write);
      this.webGLContext.pressure.swap();
    }
    this.gradienSubtractProgram.bind();
    this.gl.uniform2f(
      this.gradienSubtractProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    this.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uPressure,
      this.webGLContext.pressure.read.attach(0)
    );
    this.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(1)
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    this.advectionProgram.bind();
    this.gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.webGLContext.velocity.texelSizeX,
      this.webGLContext.velocity.texelSizeY
    );
    if (!this.webGLContext.ext.supportLinearFiltering)
      this.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.webGLContext.velocity.texelSizeX,
        this.webGLContext.velocity.texelSizeY
      );
    let velocityId = this.webGLContext.velocity.read.attach(0);
    this.gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
    this.gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
    this.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    this.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.velocityDissipation
    );
    this.webGLContext.blit(this.webGLContext.velocity.write);
    this.webGLContext.velocity.swap();
    if (!this.webGLContext.ext.supportLinearFiltering)
      this.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.webGLContext.dye.texelSizeX,
        this.webGLContext.dye.texelSizeY
      );
    this.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.webGLContext.velocity.read.attach(0)
    );
    this.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.webGLContext.dye.read.attach(1)
    );
    this.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.densityDissipation
    );
    this.webGLContext.blit(this.webGLContext.dye.write);
    this.webGLContext.dye.swap();
  }

  drawDisplay(target: any) {
    let width = target == null ? this.gl.drawingBufferWidth : target.width;
    let height = target == null ? this.gl.drawingBufferHeight : target.height;

    this.displayMaterial.bind();
    if (this.config.shading)
      this.gl.uniform2f(
        this.displayMaterial.uniforms.texelSize,
        1.0 / width,
        1.0 / height
      );

    this.gl.uniform1i(
      this.displayMaterial.uniforms.uTexture,
      this.webGLContext.dye.read.attach(0)
    );
    if (this.config.bloom) {
      this.gl.uniform1i(
        this.displayMaterial.uniforms.uBloom,
        this.webGLContext.bloom.attach(1)
      );

      this.gl.uniform1i(
        this.displayMaterial.uniforms.uDithering,
        this.displayMaterial.ditheringTexture.attach(2)
      );
      let scale = this.getTextureScale(
        this.displayMaterial.ditheringTexture,
        width,
        height
      );
      this.gl.uniform2f(
        this.displayMaterial.uniforms.ditherScale,
        scale.x,
        scale.y
      );
    }
    if (this.config.sunrays)
      this.gl.uniform1i(
        this.displayMaterial.uniforms.uSunrays,
        this.webGLContext.sunrays.attach(3)
      );

    this.webGLContext.blit(target);
  }

  getTextureScale(
    texture: {
      texture?: WebGLTexture | null;
      width: any;
      height: any;
      attach?: (id: number) => number;
    },
    width: number,
    height: number
  ) {
    return {
      x: width / texture.width,
      y: height / texture.height,
    };
  }

  render(target: any) {
    if (this.config.bloom)
      this.applyBloom(this.webGLContext.dye.read, this.webGLContext.bloom);
    if (this.config.sunrays) {
      this.applySunrays(
        this.webGLContext.dye.read,
        this.webGLContext.dye.write,
        this.webGLContext.sunrays
      );
      this.blur(this.webGLContext.sunrays, this.webGLContext.sunraysTemp, 1);
    }

    if (target == null || !this.config.transparent) {
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.BLEND);
    } else {
      this.gl.disable(this.gl.BLEND);
    }

    if (target == null || !this.config.transparent) {
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.BLEND);
    } else {
      this.gl.disable(this.gl.BLEND);
    }

    if (!this.config.transparent)
      this.drawColor(target, normalizeColor(this.config.blackColor));

    this.drawDisplay(target);
  }

  update() {
    this.updateColors(this.time.delta);
    this.applyInputs();
    if (!this.config.paused) this.step(this.time.delta);
    this.render(null);
  }

  onResizeFBO(target: FramebufferObject) {
    this.copyProgram.bind();
    this.gl.uniform1i(this.copyProgram.uniforms.uTexture, target.attach(0));
  }
  //EVENTS
  onResize() {
    this.webGLContext.initFramebuffers();
  }
  mouseMove(e: MouseEvent) {
    let pointer = this.pointers[0];

    if (!pointer.down && this.config.onlyHover == false) return;

    pointer.updatePointerMoveData(e.offsetX, e.offsetY);
  }

  mouseUp() {
    this.pointers[0].setPointerDown();
  }
  mouseDown(e: MouseEvent) {
    let pointer = this.pointers.find((p) => p.id == -1);

    if (pointer == null) pointer = new Pointer(this.canvasClass.canvas);
    pointer.onTouchStart(-1, e.offsetX, e.offsetY);
    pointer.color = generateColor();
  }

  touchStart(e: any) {
    e.preventDefault();
    const touches = e.targetTouches;

    while (touches.length >= this.pointers.length)
      this.pointers.push(new Pointer(this.canvasClass.canvas));
    for (let i = 0; i < touches.length; i++) {
      this.pointers[i + 1].onTouchStart(
        touches[i].identifier,
        touches[i].pageX,
        touches[i].pageY
      );
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
    if (e.code === "KeyP") this.config.paused = !this.config.paused;
    if (e.key === " ") this.splatStack.push(Math.random() * 20 + 5);
  }
}
