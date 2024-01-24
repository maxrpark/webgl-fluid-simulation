import WebGLContext from "../WebGLContext.js";
import { shaderType } from "../ts/global.js";
export default class ShaderCompiler {
    shader: any;
    webGLContext: WebGLContext;
    gl: WebGL2RenderingContext;
    constructor(webGLContext: WebGLContext, type: shaderType, sourceShader: string, keywords: string[] | null);
    addKeywords(source: string, keywords: string[] | null): string;
}
