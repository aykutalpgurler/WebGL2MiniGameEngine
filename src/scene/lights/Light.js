export class Light {
  constructor(color = [1, 1, 1], intensity = 1.0) {
    this.color = color;
    this.intensity = intensity;
  }

  setColor(color) {
    this.color = color;
    return this;
  }

  setIntensity(intensity) {
    this.intensity = intensity;
    return this;
  }

  apply(_gl, _program, _prefix) {
    // Implemented by subclasses
  }
}
