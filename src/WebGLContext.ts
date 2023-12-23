import FluidSimulation from "./FluidSimulation.js";
import { FramebufferObject } from "./FramebufferObject.js";
import Target from "./Target.js";

export default class WebGLContext {
  fluidSimulation: FluidSimulation;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  ext: {
    formatRGBA: any;
    formatRG: any;
    formatR: any;
    halfFloatTexType: any;
    supportLinearFiltering: any;
  };

  internalFormat: any;
  format: any;

  dye: any; // TODO
  velocity: any; // TODO;
  divergence: any; // TODO;
  curl: any; // TODO;
  pressure: any; // TODO;
  bloom: any; // TODO;
  bloomFramebuffers: any[] = []; // TODO;
  sunrays: any; // TODO;
  sunraysTemp: any; // TODO;

  constructor() {
    this.fluidSimulation = new FluidSimulation({});
    this.canvas = this.fluidSimulation.canvasClass.canvas;

    this.ext = {
      formatRGBA: null,
      formatRG: null,
      formatR: null,
      halfFloatTexType: null,
      supportLinearFiltering: null,
    };

    this.getWebGLContext();
  }

  getWebGLContext() {
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
    this.gl = <WebGL2RenderingContext>this.canvas.getContext("webgl2", params)!;

    const isWebGL2 = !!this.gl; // TODO

    if (!isWebGL2)
      this.gl =
        (this.canvas.getContext("webgl", params) as WebGL2RenderingContext) ||
        (this.canvas.getContext(
          "experimental-webgl",
          params
        ) as WebGL2RenderingContext);

    let halfFloat: any = null;

    if (isWebGL2) {
      this.gl.getExtension("EXT_color_buffer_float");
      this.ext.supportLinearFiltering = this.gl.getExtension(
        "OES_texture_float_linear"
      );
    } else {
      halfFloat = this.gl.getExtension("OES_texture_half_float");
      this.ext.supportLinearFiltering = this.gl.getExtension(
        "OES_texture_half_float_linear"
      );
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.ext.halfFloatTexType = isWebGL2
      ? this.gl.HALF_FLOAT
      : halfFloat.HALF_FLOAT_OES;

    if (isWebGL2) {
      this.ext.formatRGBA = this.getSupportedFormat(
        this.gl.RGBA16F,
        this.gl.RGBA,
        this.ext.halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl.RG16F,
        this.gl.RG,
        this.ext.halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl.R16F,
        this.gl.RED,
        this.ext.halfFloatTexType
      );
    } else {
      this.ext.formatRGBA = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        this.ext.halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        this.ext.halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        this.ext.halfFloatTexType
      );
    }
  }
  getSupportedFormat(
    internalFormat: number,
    format: number,
    type: number
  ): any {
    if (!this.gl) return;

    if (!this.supportRenderTextureFormat(internalFormat, format, type)) {
      switch (internalFormat) {
        case this.gl.R16F:
          return this.getSupportedFormat(this.gl.RG16F, this.gl.RG, type);
        case this.gl.RG16F:
          return this.getSupportedFormat(this.gl.RGBA16F, this.gl.RGBA, type);
        default:
          return null;
      }
    }

    return {
      internalFormat,
      format,
    };
  }

  supportRenderTextureFormat(
    internalFormat: number,
    format: number,
    type: number
  ) {
    if (!this.gl) return;

    let texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    let framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    let status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    return status == this.gl.FRAMEBUFFER_COMPLETE;
  }

  createFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    minFilter: number
  ): FramebufferObject {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      format,
      type,
      null
    );

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / width;
    const texelSizeY = 1.0 / height;

    return new FramebufferObject({
      texture: texture!,
      framebuffer: framebuffer!,
      width,
      height,
      texelSizeX,
      texelSizeY,
    });
  }

  resizeFBO(
    target: FramebufferObject,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): FramebufferObject {
    const newFBO = this.createFBO(w, h, internalFormat, format, type, param);
    this.fluidSimulation.copyProgram.bind();
    this.gl.uniform1i(
      this.fluidSimulation.copyProgram.uniforms.uTexture,
      target.attach(0)
    );
    this.blit(newFBO);
    return newFBO;
  }

  resizeDoubleFBO(
    target: Target,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): Target {
    if (target.width === width && target.height === height) {
      return target;
    }

    target.read = this.resizeFBO(
      target.read,
      width,
      height,
      internalFormat,
      format,
      type,
      param
    );
    target.write = this.createFBO(
      width,
      height,
      internalFormat,
      format,
      type,
      param
    );
    target.width = width;
    target.height = height;
    target.texelSizeX = 1.0 / width;
    target.texelSizeY = 1.0 / height;

    return target;
  }

  createDoubleFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): Target {
    const fbo1 = this.createFBO(
      width,
      height,
      internalFormat,
      format,
      type,
      param
    );
    const fbo2 = this.createFBO(
      width,
      height,
      internalFormat,
      format,
      type,
      param
    );

    return new Target({
      read: fbo1,
      write: fbo2,
      width,
      height,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
    });
  }

  blit(target: any) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      this.gl.STATIC_DRAW
    );
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      this.gl.STATIC_DRAW
    );
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.enableVertexAttribArray(0);
    const func = (target: FramebufferObject, clear = false) => {
      if (target == null) {
        this.gl.viewport(
          0,
          0,
          this.gl.drawingBufferWidth,
          this.gl.drawingBufferHeight
        );
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      } else {
        //Resize
        this.gl.viewport(0, 0, target.width, target.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.framebuffer);
      }
      if (clear) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      }

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    };

    func(target);
  }

  initFramebuffers() {
    let simRes = this.getResolution(this.fluidSimulation.config.simResolution);
    let dyeRes = this.getResolution(this.fluidSimulation.config.dyeResolution);

    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA!;
    const rg = this.ext.formatRG!;
    const r = this.ext.formatR!;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

    this.gl.disable(this.gl.BLEND);

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
      this.gl.NEAREST
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );

    this.initBloomFramebuffers();
    this.initSunraysFramebuffers();
  }

  initBloomFramebuffers() {
    let res = this.getResolution(this.fluidSimulation.config.BLOOM_RESOLUTION);
    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA!;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

    this.bloom = this.createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    for (let i = 0; i < this.fluidSimulation.config.BLOOM_ITERATIONS; i++) {
      let width = res.width >> (i + 1);
      let height = res.height >> (i + 1);
      if (width < 2 || height < 2) break;

      const framebuffer = this.createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      this.bloomFramebuffers.push(framebuffer);
    }
  }

  initSunraysFramebuffers() {
    let res = this.getResolution(
      this.fluidSimulation.config.SUNRAYS_RESOLUTION
    );

    const texType = this.ext.halfFloatTexType;
    const r = this.ext.formatR!;
    const filtering = this.ext.supportLinearFiltering
      ? this.gl.LINEAR
      : this.gl.NEAREST;

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
  getResolution(resolution: number) {
    let aspectRatio = this.gl.drawingBufferWidth / this.gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (this.gl.drawingBufferWidth > this.gl.drawingBufferHeight)
      return { width: max, height: min };
    else return { width: min, height: max };
  }
}
