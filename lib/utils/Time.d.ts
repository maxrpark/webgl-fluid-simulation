import EventEmitter from "./EventEmitter.js";
export default class Time extends EventEmitter {
    start: number;
    current: number;
    delta: number;
    elapsed: number;
    lastUpdateTime: number;
    constructor();
    calcDeltaTime(): void;
    tick(): void;
}
