interface Props {
    gl: WebGL2RenderingContext;
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
}
export declare class FramebufferObject {
    gl: WebGL2RenderingContext;
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    constructor(props: Props);
    attach(textureUnit: number): number;
}
export {};
