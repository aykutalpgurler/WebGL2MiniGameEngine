export class Time {
  constructor() {
    this.lastTime = performance.now();
    this.deltaTime = 0;
  }

  update() {
    const now = performance.now();
    this.deltaTime = (now - this.lastTime) / 1000.0;
    this.lastTime = now;
  }
}
