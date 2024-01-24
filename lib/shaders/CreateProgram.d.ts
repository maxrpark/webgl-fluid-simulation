import WebGLContext from "../WebGLContext.js";
interface Props {
    webGLContext: WebGLContext;
    vertexShader?: string;
    fragmentShader: string;
}
export default class CreateProgram {
    instance: WebGLShader;
    webGLContext: WebGLContext;
    gl: WebGL2RenderingContext;
    uniforms: any;
    vertexShader: string;
    constructor({ webGLContext, vertexShader, fragmentShader }: Props);
    createProgram(vertexShader: string, fragmentShader: string): void;
    getUniforms(program: WebGLProgram): void;
}
export {};
