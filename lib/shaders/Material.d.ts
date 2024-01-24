import WebGLContext from "../WebGLContext.js";
interface Props {
    vertexShader: string;
    webGLContext: WebGLContext;
    config: {
        shading: boolean;
        bloom: boolean;
        sunrays: boolean;
    };
}
export default class Material {
    webGLContext: WebGLContext;
    gl: WebGL2RenderingContext;
    config: {
        shading: boolean;
        bloom: boolean;
        sunrays: boolean;
    };
    program: any;
    vertexShader: string;
    fragmentShaderSource: string;
    programs: WebGLShader[];
    activeProgram: any;
    uniforms: {
        texelSize: any;
        uTexture: any;
        uBloom: any;
        uDithering: any;
        ditherScale: any;
        uSunrays: any;
    };
    ditheringTexture: any;
    constructor(props: Props);
    createFragmentShader(keywords: string[]): void;
    bind(): void;
    createTextureAsync(url: string): {
        texture: WebGLTexture | null;
        width: number;
        height: number;
        attach(id: number): number;
    };
    updateKeywords(): void;
}
export {};
