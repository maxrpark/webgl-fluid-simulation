import { FramebufferObject } from "./FramebufferObject.js";
interface Props {
    read: FramebufferObject;
    write: FramebufferObject;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
}
export default class Target {
    read: FramebufferObject;
    write: FramebufferObject;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    constructor(props: Props);
    swap(): void;
}
export {};
