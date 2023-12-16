import PointerPrototype from "./PointerPrototype.js";
import Material from "./shaders/Material.js";
import Program from "./Program.js";
import BaseVertexShader from "./shaders/vertex/baseVertexShader.js";
import BlurVertexShader from "./shaders/vertex/BlurVertexShader.js";

import Time from "./utils/Time.js";

import BlurShader from "./shaders/fragment/BlurShader.js";
import CopyShader from "./shaders/fragment/CopyShader.js";
import GradientSubtractShader from "./shaders/fragment/GradientSubtractShader.js";
import PressureShader from "./shaders/fragment/PressureShader.js";
import VorticityShader from "./shaders/fragment/VorticityShader.js";
import CurlShader from "./shaders/fragment/CurlShader.js";
import DivergenceShader from "./shaders/fragment/DivergenceShader.js";
import AdvectionShader from "./shaders/fragment/AdvectionShader.js";
import SplatShader from "./shaders/fragment/SplatShader.js";
import SunraysShader from "./shaders/fragment/SunraysShader.js";
import SunRaysMaskShader from "./shaders/fragment/SunRaysMaskShader.js";
import BloomFinalShader from "./shaders/fragment/bloomFinalShader.js";
import BloomBlurShader from "./shaders/fragment/BloomBlurShader.js";
import BloomPrefilterShader from "./shaders/fragment/BloomPrefilterShader.js";
import CheckerboardShader from "./shaders/fragment/CheckerboardShader.js";
import ColorShader from "./shaders/fragment/ColorShader.js";
import ClearShader from "./shaders/fragment/ClearShader.js";
import { generateColor, scaleByPixelRatio, wrap } from "./utils/helperFunc.js";

interface Pointer {
  id: any;
  down: boolean;
  moved: boolean;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: any;
  prevTexcoordY: any;
  deltaX: number;
  deltaY: number;
  color: { r: number; g: number; b: number; a: number };
}

interface Target {
  write: {
    texture: WebGLTexture | null;
    fbo: WebGLFramebuffer | null;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    attach(id: number): number;
  };
  texelSizeX: number;
  texelSizeY: number;
  read: {
    texture: WebGLTexture | null;
    fbo: WebGLFramebuffer | null;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    attach(id: number): number;
  };
  attach(arg0: number): number;
  width: number;
  height: number;
  fbo: WebGLFramebuffer;
}

declare global {
  interface Window {
    fluidSimulation: FluidSimulation;
  }
}

export interface FluidSimulationInt {
  canvas?: HTMLCanvasElement | undefined;
}

let instance: FluidSimulation | null = null;

export const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: true,
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 },
  TRANSPARENT: false,
  BLOOM: true,
  BLOOM_ITERATIONS: 8,
  BLOOM_RESOLUTION: 256,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 1.0,
  ONLY_HOVER: true,
};

export default class FluidSimulation {
  canvas: HTMLCanvasElement;
  webGLContext: any;
  displayMaterial: Material;

  //

  dye: any; // TODO
  velocity: any; // TODO;
  divergence: any; // TODO;
  curl: any; // TODO;
  pressure: any; // TODO;
  bloom: any; // TODO;
  bloomFramebuffers: any[] = []; // TODO;
  sunrays: any; // TODO;
  sunraysTemp: any; // TODO;
  fbo: any;
  pointers: any[] = [];
  splatStack: any[] = [];

  baseVertexShader: BaseVertexShader;
  blurVertexShader: BlurVertexShader;
  blurShader: BlurShader;
  copyShader: CopyShader;
  clearShader: ClearShader;
  colorShader: ColorShader;
  checkerboardShader: CheckerboardShader;
  bloomPrefilterShader: BloomPrefilterShader;
  bloomBlurShader: BloomBlurShader;
  bloomFinalShader: BloomFinalShader;
  sunraysMaskShader: SunRaysMaskShader;
  sunraysShader: SunraysShader;
  splatShader: SplatShader;
  advectionShader: AdvectionShader;
  divergenceShader: DivergenceShader;
  curlShader: CurlShader;
  vorticityShader: VorticityShader;
  pressureShader: PressureShader;
  gradientSubtractShader: GradientSubtractShader;

  // PROGRAMS

  blurProgram: Program;
  copyProgram: Program;
  clearProgram: Program;
  colorProgram: Program;
  checkerboardProgram: Program;
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

  time: Time;

  colorUpdateTimer: number;

  constructor(canv?: HTMLCanvasElement) {
    if (instance) {
      return instance;
    }
    this.canvas = canv!;
    this.colorUpdateTimer = 0;

    this.time = new Time();

    instance = this;
    this.time.on("tick", () => this.update());

    const canvas = canv;
    this.resizeCanvas();

    this.pointers.push(new PointerPrototype());

    const getWebGLContext = () => {
      const params = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
      };
      if (!(this.canvas instanceof HTMLCanvasElement)) {
        throw new Error(
          `The element of id "TODO" is not a HTMLCanvasElement. Make sure a <canvas id="TODO""> element is present in the document.`
        ); // ERROR
      }
      let gl: WebGL2RenderingContext | null = <WebGL2RenderingContext>(
        this.canvas.getContext("webgl2", params)!
      );

      const isWebGL2 = !!gl; // TODO

      if (!gl)
        gl =
          (this.canvas.getContext("webgl", params) as WebGL2RenderingContext) ||
          (this.canvas.getContext(
            "experimental-webgl",
            params
          ) as WebGL2RenderingContext);

      let halfFloat;
      let supportLinearFiltering;
      if (gl) {
        gl.getExtension("EXT_color_buffer_float");
        supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
      } else {
        halfFloat = gl.getExtension("OES_texture_half_float");
        supportLinearFiltering = gl.getExtension(
          "OES_texture_half_float_linear"
        );
      }

      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      const halfFloatTexType = isWebGL2
        ? gl.HALF_FLOAT
        : halfFloat.HALF_FLOAT_OES;
      let formatRGBA;
      let formatRG;
      let formatR;

      if (isWebGL2) {
        formatRGBA = getSupportedFormat(
          gl,
          gl.RGBA16F,
          gl.RGBA,
          halfFloatTexType
        );
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }

      return {
        gl,
        ext: {
          formatRGBA,
          formatRG,
          formatR,
          halfFloatTexType,
          supportLinearFiltering,
        },
      };
    };

    this.webGLContext = getWebGLContext(canvas!);

    if (isMobile()) {
      config.DYE_RESOLUTION = 512;
    }
    if (!this.webGLContext.ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 512;
      config.SHADING = false;
      config.BLOOM = false;
      config.SUNRAYS = false;
    }

    function getSupportedFormat(
      gl: WebGL2RenderingContext,
      internalFormat: number,
      format: number,
      type: number
    ) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F:
            return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F:
            return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default:
            return null;
        }
      }

      return {
        internalFormat,
        format,
      };
    }

    function supportRenderTextureFormat(
      gl: WebGL2RenderingContext,
      internalFormat: number,
      format: number,
      type: number
    ) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        4,
        4,
        0,
        format,
        type,
        null
      );

      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );

      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status == gl.FRAMEBUFFER_COMPLETE;
    }

    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }

    this.blit(null);

    this.baseVertexShader = new BaseVertexShader();
    this.blurVertexShader = new BlurVertexShader();
    this.blurShader = new BlurShader();
    this.copyShader = new CopyShader();
    this.clearShader = new ClearShader();
    this.colorShader = new ColorShader();
    this.checkerboardShader = new CheckerboardShader();
    this.bloomPrefilterShader = new BloomPrefilterShader();
    this.bloomBlurShader = new BloomBlurShader();
    this.bloomFinalShader = new BloomFinalShader();
    this.sunraysMaskShader = new SunRaysMaskShader();
    this.sunraysShader = new SunraysShader();
    this.splatShader = new SplatShader();
    this.advectionShader = new AdvectionShader();
    this.divergenceShader = new DivergenceShader();
    this.curlShader = new CurlShader();
    this.vorticityShader = new VorticityShader();
    this.pressureShader = new PressureShader();
    this.gradientSubtractShader = new GradientSubtractShader();

    this.displayMaterial = new Material(this.baseVertexShader.shader);

    this.blurProgram = new Program(
      this.blurVertexShader.shader,
      this.blurShader.shader
    );
    this.copyProgram = new Program(
      this.baseVertexShader.shader,
      this.copyShader.shader
    );
    this.clearProgram = new Program(
      this.baseVertexShader.shader,
      this.clearShader.shader
    );
    this.colorProgram = new Program(
      this.baseVertexShader.shader,
      this.colorShader.shader
    );
    this.checkerboardProgram = new Program(
      this.baseVertexShader.shader,
      this.checkerboardShader.shader
    );
    this.bloomPrefilterProgram = new Program(
      this.baseVertexShader.shader,
      this.bloomPrefilterShader.shader
    );
    this.bloomBlurProgram = new Program(
      this.baseVertexShader.shader,
      this.bloomBlurShader.shader
    );
    this.bloomFinalProgram = new Program(
      this.baseVertexShader.shader,
      this.bloomFinalShader.shader
    );
    this.sunraysMaskProgram = new Program(
      this.baseVertexShader.shader,
      this.sunraysMaskShader.shader
    );
    this.sunraysProgram = new Program(
      this.baseVertexShader.shader,
      this.sunraysShader.shader
    );
    this.splatProgram = new Program(
      this.baseVertexShader.shader,
      this.splatShader.shader
    );
    this.advectionProgram = new Program(
      this.baseVertexShader.shader,
      this.advectionShader.shader
    );
    this.divergenceProgram = new Program(
      this.baseVertexShader.shader,
      this.divergenceShader.shader
    );
    this.curlProgram = new Program(
      this.baseVertexShader.shader,
      this.curlShader.shader
    );
    this.vorticityProgram = new Program(
      this.baseVertexShader.shader,
      this.vorticityShader.shader
    );
    this.pressureProgram = new Program(
      this.baseVertexShader.shader,
      this.pressureShader.shader
    );
    this.gradienSubtractProgram = new Program(
      this.baseVertexShader.shader,
      this.gradientSubtractShader.shader
    );

    this.initFramebuffers();

    const correctRadius = (radius: number) => {
      let aspectRatio = this.canvas.width / this.canvas.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    };

    const splat = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      color: { r: any; g: any; b: any; a?: number }
    ) => {
      this.splatProgram.bind();

      this.webGLContext.gl.uniform1i(
        this.splatProgram.uniforms.uTarget,
        this.velocity.read.attach(0)
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
      this.blit(this.velocity.write);
      this.velocity.swap();

      this.webGLContext.gl.uniform1i(
        this.splatProgram.uniforms.uTarget,
        this.dye.read.attach(0)
      );
      this.webGLContext.gl.uniform3f(
        this.splatProgram.uniforms.color,
        color.r,
        color.g,
        color.b
      );
      this.blit(this.dye.write);
      this.dye.swap();
    };

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
        splat(x, y, dx, dy, color);
      }
    };
    multipleSplats(Math.random() * 20 + 5);

    this.canvas.addEventListener("mousedown", (e) => {
      let posX = scaleByPixelRatio(e.offsetX);
      let posY = scaleByPixelRatio(e.offsetY);
      let pointer = this.pointers.find((p) => p.id == -1);
      if (pointer == null) pointer = new PointerPrototype();
      updatePointerDownData(pointer, -1, posX, posY);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      let pointer = this.pointers[0];
      if (!pointer.down && config.ONLY_HOVER == false) return;
      let posX = scaleByPixelRatio(e.offsetX);
      let posY = scaleByPixelRatio(e.offsetY);
      updatePointerMoveData(pointer, posX, posY);
    });

    window.addEventListener("mouseup", () => {
      updatePointerUpData(this.pointers[0]);
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      while (touches.length >= pointers.length)
        pointers.push(new PointerPrototype());
      for (let i = 0; i < touches.length; i++) {
        let posX = scaleByPixelRatio(touches[i].pageX);
        let posY = scaleByPixelRatio(touches[i].pageY);
        updatePointerDownData(
          pointers[i + 1],
          touches[i].identifier,
          posX,
          posY
        );
      }
    });

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        const touches = e.targetTouches;
        for (let i = 0; i < touches.length; i++) {
          let pointer = pointers[i + 1];
          if (!pointer.down) continue;
          let posX = scaleByPixelRatio(touches[i].pageX);
          let posY = scaleByPixelRatio(touches[i].pageY);
          updatePointerMoveData(pointer, posX, posY);
        }
      },
      false
    );

    window.addEventListener("touchend", (e) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        let pointer = pointers.find((p) => p.id == touches[i].identifier);
        if (pointer == null) continue;
        updatePointerUpData(pointer);
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyP") config.PAUSED = !config.PAUSED;
      if (e.key === " ") this.splatStack.push(Math.random() * 20 + 5);
    });

    const updatePointerDownData = (
      pointer: Pointer,
      id: number,
      posX: number,
      posY: number
    ) => {
      pointer.id = id;
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = posX / this.canvas.width;
      pointer.texcoordY = 1.0 - posY / this.canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = generateColor();
    };

    const updatePointerMoveData = (
      pointer: Pointer,
      posX: number,
      posY: number
    ) => {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / this.canvas.width;
      pointer.texcoordY = 1.0 - posY / this.canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved =
        Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    };

    const updatePointerUpData = (pointer: Pointer) => {
      pointer.down = false;
    };

    const correctDeltaX = (delta: number) => {
      let aspectRatio = this.canvas.width / this.canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    };

    const correctDeltaY = (delta: number) => {
      let aspectRatio = this.canvas.width / this.canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    };

    this.updateKeywords();
    this.update();
  }

  updateKeywords() {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    if (config.SUNRAYS) displayKeywords.push("SUNRAYS");
    this.displayMaterial.setKeywords(displayKeywords);
  }

  resizeCanvas() {
    let width = scaleByPixelRatio(this.canvas.clientWidth);
    let height = scaleByPixelRatio(this.canvas.clientHeight);
    if (this.canvas.width != width || this.canvas.height != height) {
      this.canvas.width = width;
      this.canvas.height = height;
      return true;
    }
    return false;
  }

  getResolution(resolution: number) {
    let aspectRatio =
      this.webGLContext.gl.drawingBufferWidth /
      this.webGLContext.gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (
      this.webGLContext.gl.drawingBufferWidth >
      this.webGLContext.gl.drawingBufferHeight
    )
      return { width: max, height: min };
    else return { width: min, height: max };
  }

  blit(target: any) {
    this.webGLContext.gl.bindBuffer(
      this.webGLContext.gl.ARRAY_BUFFER,
      this.webGLContext.gl.createBuffer()
    );
    this.webGLContext.gl.bufferData(
      this.webGLContext.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      this.webGLContext.gl.STATIC_DRAW
    );
    this.webGLContext.gl.bindBuffer(
      this.webGLContext.gl.ELEMENT_ARRAY_BUFFER,
      this.webGLContext.gl.createBuffer()
    );
    this.webGLContext.gl.bufferData(
      this.webGLContext.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      this.webGLContext.gl.STATIC_DRAW
    );
    this.webGLContext.gl.vertexAttribPointer(
      0,
      2,
      this.webGLContext.gl.FLOAT,
      false,
      0,
      0
    );
    this.webGLContext.gl.enableVertexAttribArray(0);
    const func = (target: Target, clear = false) => {
      if (target == null) {
        this.webGLContext.gl.viewport(
          0,
          0,
          this.webGLContext.gl.drawingBufferWidth,
          this.webGLContext.gl.drawingBufferHeight
        );
        this.webGLContext.gl.bindFramebuffer(
          this.webGLContext.gl.FRAMEBUFFER,
          null
        );
      } else {
        this.webGLContext.gl.viewport(0, 0, target.width, target.height);
        this.webGLContext.gl.bindFramebuffer(
          this.webGLContext.gl.FRAMEBUFFER,
          target.fbo
        );
      }
      if (clear) {
        this.webGLContext.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.webGLContext.gl.clear(this.webGLContext.gl.COLOR_BUFFER_BIT);
      }
      this.webGLContext.gl.drawElements(
        this.webGLContext.gl.TRIANGLES,
        6,
        this.webGLContext.gl.UNSIGNED_SHORT,
        0
      );
    };

    func(target);
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
    this.blit(target);
  }

  // HELPER
  normalizeColor(input: { r: number; g: number; b: number }) {
    let output = {
      r: input.r / 255,
      g: input.g / 255,
      b: input.b / 255,
    };
    return output;
  }

  render(target: any) {
    if (config.BLOOM) this.applyBloom(this.dye.read, this.bloom);
    if (config.SUNRAYS) {
      this.applySunrays(this.dye.read, this.dye.write, this.sunrays);
      this.blur(this.sunrays, this.sunraysTemp, 1);
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
      this.drawColor(target, this.normalizeColor(config.BACK_COLOR));
    if (target == null && config.TRANSPARENT) drawCheckerboard(target);

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

  initFramebuffers() {
    let simRes = this.getResolution(config.SIM_RESOLUTION);
    let dyeRes = this.getResolution(config.DYE_RESOLUTION);

    const texType = this.webGLContext.ext.halfFloatTexType;
    const rgba = this.webGLContext.ext.formatRGBA!;
    const rg = this.webGLContext.ext.formatRG!;
    const r = this.webGLContext.ext.formatR!;
    const filtering = this.webGLContext.ext.supportLinearFiltering
      ? this.webGLContext.gl.LINEAR
      : this.webGLContext.gl.NEAREST;

    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);

    if (this.dye == null)
      this.dye = this.createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba!.internalFormat,
        rgba!.format,
        texType,
        filtering
      );
    else
      this.dye = this.resizeDoubleFBO(
        this.dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );

    if (this.velocity == null)
      this.velocity = this.createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    else
      this.velocity = this.resizeDoubleFBO(
        this.velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );

    this.divergence = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.webGLContext.gl.NEAREST
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.webGLContext.gl.NEAREST
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.webGLContext.gl.NEAREST
    );

    this.initBloomFramebuffers();
    this.initSunraysFramebuffers();
  }

  update() {
    if (this.resizeCanvas()) this.initFramebuffers();
    this.updateColors(this.time.delta);
    this.applyInputs();
    if (!config.PAUSED) this.step(this.time.delta);
    this.render(null);
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

  createDoubleFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ) {
    let fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = this.createFBO(w, h, internalFormat, format, type, param);

    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        let temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  resizeFBO(
    target: any,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ) {
    let newFBO = this.createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    this.webGLContext.gl.uniform1i(
      copyProgram.uniforms.uTexture,
      target.attach(0)
    );
    this.blit(newFBO);
    return newFBO;
  }

  resizeDoubleFBO(
    target: Target,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ) {
    if (target.width == w && target.height == h) return target;
    target.read = this.resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = this.createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
  }

  createFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ) {
    this.webGLContext.gl.activeTexture(this.webGLContext.gl.TEXTURE0);
    let texture = this.webGLContext.gl.createTexture();
    this.webGLContext.gl.bindTexture(this.webGLContext.gl.TEXTURE_2D, texture);
    this.webGLContext.gl.texParameteri(
      this.webGLContext.gl.TEXTURE_2D,
      this.webGLContext.gl.TEXTURE_MIN_FILTER,
      param
    );
    this.webGLContext.gl.texParameteri(
      this.webGLContext.gl.TEXTURE_2D,
      this.webGLContext.gl.TEXTURE_MAG_FILTER,
      param
    );
    this.webGLContext.gl.texParameteri(
      this.webGLContext.gl.TEXTURE_2D,
      this.webGLContext.gl.TEXTURE_WRAP_S,
      this.webGLContext.gl.CLAMP_TO_EDGE
    );
    this.webGLContext.gl.texParameteri(
      this.webGLContext.gl.TEXTURE_2D,
      this.webGLContext.gl.TEXTURE_WRAP_T,
      this.webGLContext.gl.CLAMP_TO_EDGE
    );
    this.webGLContext.gl.texImage2D(
      this.webGLContext.gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      type,
      null
    );

    let fbo = this.webGLContext.gl.createFramebuffer();
    this.webGLContext.gl.bindFramebuffer(this.webGLContext.gl.FRAMEBUFFER, fbo);
    this.webGLContext.gl.framebufferTexture2D(
      this.webGLContext.gl.FRAMEBUFFER,
      this.webGLContext.gl.COLOR_ATTACHMENT0,
      this.webGLContext.gl.TEXTURE_2D,
      texture,
      0
    );
    this.webGLContext.gl.viewport(0, 0, w, h);
    this.webGLContext.gl.clear(this.webGLContext.gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;
    let gl = this.webGLContext.gl;
    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  initBloomFramebuffers() {
    let res = this.getResolution(config.BLOOM_RESOLUTION);

    const texType = this.webGLContext.ext.halfFloatTexType;
    const rgba = this.webGLContext.ext.formatRGBA!;
    const filtering = this.webGLContext.ext.supportLinearFiltering
      ? this.webGLContext.gl.LINEAR
      : this.webGLContext.gl.NEAREST;

    this.bloom = this.createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    // const bloomFramebuffers = {
    //   length: 0,
    // };
    // bloomFramebuffers.length = 0;

    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      let width = res.width >> (i + 1);
      let height = res.height >> (i + 1);

      if (width < 2 || height < 2) break;

      this.fbo = this.createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      this.bloomFramebuffers.push(this.fbo);
    }
  }

  initSunraysFramebuffers() {
    let res = this.getResolution(config.SUNRAYS_RESOLUTION);

    const texType = this.webGLContext.ext.halfFloatTexType;
    const r = this.webGLContext.ext.formatR!;
    const filtering = this.webGLContext.ext.supportLinearFiltering
      ? this.webGLContext.gl.LINEAR
      : this.webGLContext.gl.NEAREST;

    this.sunrays = this.createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
    this.sunraysTemp = this.createFBO(
      res.width,
      res.height,
      r.internalFormat,
      r.format,
      texType,
      filtering
    );
  }

  step(dt: number) {
    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);

    this.curlProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.curl);

    this.vorticityProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.vorticityProgram.uniforms.uCurl,
      this.curl.attach(1)
    );
    this.webGLContext.gl.uniform1f(
      this.vorticityProgram.uniforms.curl,
      config.CURL
    );
    this.webGLContext.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.divergenceProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.blit(this.divergence);

    this.clearProgram.bind();
    this.webGLContext.gl.uniform1i(
      this.clearProgram.uniforms.uTexture,
      this.pressure.read.attach(0)
    );
    this.webGLContext.gl.uniform1f(
      this.clearProgram.uniforms.value,
      config.PRESSURE
    );
    this.blit(this.pressure.write);
    this.pressure.swap();

    this.pressureProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.divergence.attach(0)
    );
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      this.webGLContext.gl.uniform1i(
        this.pressureProgram.uniforms.uPressure,
        this.pressure.read.attach(1)
      );
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    this.gradienSubtractProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.gradienSubtractProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this.webGLContext.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uPressure,
      this.pressure.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.gradienSubtractProgram.uniforms.uVelocity,
      this.velocity.read.attach(1)
    );
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.advectionProgram.bind();
    this.webGLContext.gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    if (!this.webGLContext.ext.supportLinearFiltering)
      this.webGLContext.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY
      );
    let velocityId = this.velocity.read.attach(0);
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
    this.blit(this.velocity.write);
    this.velocity.swap();

    if (!this.webGLContext.ext.supportLinearFiltering)
      this.webGLContext.gl.uniform2f(
        this.advectionProgram.uniforms.dyeTexelSize,
        this.dye.texelSizeX,
        this.dye.texelSizeY
      );
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read.attach(0)
    );
    this.webGLContext.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.dye.read.attach(1)
    );
    this.webGLContext.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION
    );
    this.blit(this.dye.write);
    this.dye.swap();
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
      this.velocity.read.attach(0)
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
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.webGLContext.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.dye.read.attach(0)
    );
    this.webGLContext.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color.r,
      color.g,
      color.b
    );
    this.blit(this.dye.write);
    this.dye.swap();
  }

  correctRadius(radius: number) {
    let aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  drawCheckerboard = (target) => {
    checkerboardProgram.bind();
    this.webGLContext.gl.uniform1f(
      checkerboardProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.blit(target);
  };

  applyBloom(source, destination) {
    if (this.bloomFramebuffers.length < 2) return;

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
    this.blit(last);

    this.bloomBlurProgram.bind();
    for (let i = 0; i < this.bloomFramebuffers.length; i++) {
      let dest = this.bloomFramebuffers[i];
      this.webGLContext.gl.uniform2f(
        this.bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY
      );
      this.webGLContext.gl.uniform1i(
        this.bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      this.blit(dest);
      last = dest;
    }

    this.webGLContext.gl.blendFunc(
      this.webGLContext.gl.ONE,
      this.webGLContext.gl.ONE
    );
    this.webGLContext.gl.enable(this.webGLContext.gl.BLEND);

    for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = this.bloomFramebuffers[i];
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
      this.blit(baseTex);
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
    this.blit(destination);
  }

  applySunrays(source, mask, destination) {
    this.webGLContext.gl.disable(this.webGLContext.gl.BLEND);
    this.sunraysMaskProgram.bind();
    this.webGLContext.gl.uniform1i(
      this.sunraysMaskProgram.uniforms.uTexture,
      source.attach(0)
    );
    this.blit(mask);

    this.sunraysProgram.bind();
    this.webGLContext.gl.uniform1f(
      this.sunraysProgram.uniforms.weight,
      config.SUNRAYS_WEIGHT
    );
    this.webGLContext.gl.uniform1i(
      this.sunraysProgram.uniforms.uTexture,
      mask.attach(0)
    );
    this.blit(destination);
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
      this.blit(temp);

      this.webGLContext.gl.uniform2f(
        this.blurProgram.uniforms.texelSize,
        0.0,
        target.texelSizeY
      );
      this.webGLContext.gl.uniform1i(
        this.blurProgram.uniforms.uTexture,
        temp.attach(0)
      );
      this.blit(target);
    }
  }
}
