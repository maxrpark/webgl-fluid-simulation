import FluidSimulation from "./FluidSimulation.js";

interface Props {
  gl: WebGL2RenderingContext;
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
}

export class FramebufferObject {
  gl: WebGL2RenderingContext;
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;

  fluidSimulation: FluidSimulation;

  constructor(props: Props) {
    Object.assign(this, props);
  }

  attach(textureUnit: number) {
    this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    return textureUnit;
  }
}
