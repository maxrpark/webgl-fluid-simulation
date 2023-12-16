export default class WebGLContext {
  gl: WebGL2RenderingContext | null;
  ext: {
    formatRGBA: any;
    formatRG: any;
    formatR: any;
    halfFloatTexType: any;
    supportLinearFiltering: any;
  };

  internalFormat: any;
  format: any;
  constructor(canvas: HTMLCanvasElement) {
    this.ext = {
      formatRGBA: null,
      formatRG: null,
      formatR: null,
      halfFloatTexType: null,
      supportLinearFiltering: null,
    };

    this.getWebGLContext(canvas);
  }

  getWebGLContext(canvas: HTMLCanvasElement) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        `The element of id "TODO" is not a HTMLCanvasElement. Make sure a <canvas id="TODO""> element is present in the document.`
      ); // ERROR
    }
    this.gl = <WebGL2RenderingContext>canvas.getContext("webgl2", params)!;

    const isWebGL2 = !!this.gl; // TODO

    if (!this.gl)
      this.gl =
        (canvas.getContext("webgl", params) as WebGL2RenderingContext) ||
        (canvas.getContext(
          "experimental-webgl",
          params
        ) as WebGL2RenderingContext);

    let halfFloat;

    if (this.gl) {
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

    const halfFloatTexType = isWebGL2
      ? this.gl.HALF_FLOAT
      : halfFloat.HALF_FLOAT_OES;

    if (isWebGL2) {
      this.ext.formatRGBA = this.getSupportedFormat(
        this.gl.RGBA16F,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl.RG16F,
        this.gl.RG,
        halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl.R16F,
        this.gl.RED,
        halfFloatTexType
      );
    } else {
      this.ext.formatRGBA = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
    }
  }
  getSupportedFormat(internalFormat: number, format: number, type: number) {
    if (!this.supportRenderTextureFormat(internalFormat, format, type)) {
      switch (internalFormat) {
        case this.gl.R16F:
          return this.getSupportedFormat(
            this.gl,
            this.gl.RG16F,
            this.gl.RG,
            type
          );
        case this.gl.RG16F:
          return this.getSupportedFormat(
            this.gl,
            this.gl.RGBA16F,
            this.gl.RGBA,
            type
          );
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

    let fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
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

  update() {}
}