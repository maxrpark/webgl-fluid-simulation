import WebGLContext from "./WebGLContext.js";
interface Props {
    vertexShader?: string;
    fragmentShader: string;
    webGLContext: WebGLContext;
}
export default class Program {
    webGLContext: WebGLContext;
    gl: WebGL2RenderingContext;
    vertexShader: string;
    fragmentShader: string;
    uniforms: {
        texelSize: any;
        uTexture: any;
        uVelocity: any;
        uTarget: any;
        aspectRatio: any;
        point: any;
        radius: any;
        curve: any;
        threshold: any;
        intensity: any;
        uBloom: any;
        uDithering: any;
        ditherScale: any;
        uSunrays: any;
        color: any;
        weight: any;
        uCurl: any;
        curl: any;
        dt: any;
        value: any;
        uDivergence: any;
        uPressure: any;
        dyeTexelSize: any;
        uSource: any;
        dissipation: any;
    };
    program: WebGLProgram | null;
    constructor(props: Props);
    bind(): void;
}
export {};
