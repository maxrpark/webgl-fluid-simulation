import EventEmitter from "./EventEmitter.js";

export default class Time extends EventEmitter {
  start: number;
  current: number;
  delta: number;
  elapsed: number;
  lastUpdateTime: number;

  constructor() {
    super();
    this.start = Date.now();
    this.lastUpdateTime = this.start;
    this.current = this.start;
    this.delta = (this.current - this.lastUpdateTime) / 1000;
    this.elapsed = 0;

    this.tick();
  }

  calcDeltaTime() {
    this.current = Date.now();
    this.delta = (this.current - this.lastUpdateTime) / 1000;
    this.delta = Math.min(this.delta, 0.016666);
    this.lastUpdateTime = this.current;
  }

  tick() {
    this.calcDeltaTime();

    this.trigger("tick");
    window.requestAnimationFrame(() => this.tick());
  }
}
