import FluidSimulation from "./FluidSimulation.js";

interface Props {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
}

export class FramebufferObject {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;

  fluidSimulation: FluidSimulation;

  constructor(props: Props) {
    Object.assign(this, props);
    this.fluidSimulation = new FluidSimulation();
  }

  attach(textureUnit: number) {
    const gl = this.fluidSimulation.webGLContext.gl!;

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    return textureUnit;
  }
}
