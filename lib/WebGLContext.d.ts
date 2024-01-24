import { FramebufferObject } from "./FramebufferObject.js";
import Target from "./Target.js";
import EventEmitter from "./utils/EventEmitter.js";
interface Props {
    canvas: HTMLCanvasElement;
    config: {
        simResolution: number;
        dyeResolution: number;
        bloomIterations: number;
        sunraysResolution: number;
        bloomResolution: number;
    };
}
export default class WebGLContext extends EventEmitter {
    canvas: HTMLCanvasElement;
    config: {
        simResolution: number;
        dyeResolution: number;
        bloomIterations: number;
        sunraysResolution: number;
        bloomResolution: number;
    };
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
    dye: any;
    velocity: any;
    divergence: any;
    curl: any;
    pressure: any;
    bloom: any;
    bloomFramebuffers: any[];
    sunrays: any;
    sunraysTemp: any;
    constructor(props: Props);
    getWebGLContext(): void;
    getSupportedFormat(internalFormat: number, format: number, type: number): any;
    supportRenderTextureFormat(internalFormat: number, format: number, type: number): boolean | undefined;
    createFBO(width: number, height: number, internalFormat: number, format: number, type: number, minFilter: number): FramebufferObject;
    resizeFBO(target: FramebufferObject, w: number, h: number, internalFormat: number, format: number, type: number, param: number): FramebufferObject;
    resizeDoubleFBO(target: Target, width: number, height: number, internalFormat: number, format: number, type: number, param: number): Target;
    createDoubleFBO(width: number, height: number, internalFormat: number, format: number, type: number, param: number): Target;
    blit(target: any): void;
    initFramebuffers(): void;
    initBloomFramebuffers(): void;
    initSunraysFramebuffers(): void;
    getResolution(resolution: number): {
        width: number;
        height: number;
    };
}
export {};
