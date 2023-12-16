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
    let supportLinearFiltering;

    if (this.gl) {
      this.gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = this.gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = this.gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = this.gl.getExtension(
        "OES_texture_half_float_linear"
      );
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2
      ? this.gl.HALF_FLOAT
      : halfFloat.HALF_FLOAT_OES;

    if (isWebGL2) {
      this.ext.formatRGBA = getSupportedFormat(
        this.gl,
        this.gl.RGBA16F,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl,
        this.gl.RG16F,
        this.gl.RG,
        halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl,
        this.gl.R16F,
        this.gl.RED,
        halfFloatTexType
      );
    } else {
      this.ext.formatRGBA = this.getSupportedFormat(
        this.gl,
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatRG = this.getSupportedFormat(
        this.gl,
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
      this.ext.formatR = this.getSupportedFormat(
        this.gl,
        this.gl.RGBA,
        this.gl.RGBA,
        halfFloatTexType
      );
    }
  }
  getSupportedFormat(internalFormat: number, format: number, type: number) {
    if (!supportRenderTextureFormat(this.gl, internalFormat, format, type)) {
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
}
