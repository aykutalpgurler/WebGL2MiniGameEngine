import { Light } from "./Light.js";

export class PointLight extends Light {
  constructor(
    position = [0, 0, 0],
    color = [1, 1, 1],
    intensity = 1.0,
    attenuation = { constant: 1.0, linear: 0.09, quadratic: 0.032 }
  ) {
    super(color, intensity);
    this.position = position;
    this.attenuation = attenuation;
  }

  apply(gl, program, prefix = "uPointLight") {
    if (!program?.getUniformLocation) return;

    gl.uniform3fv(program.getUniformLocation(`${prefix}.position`), new Float32Array(this.position));
    gl.uniform3fv(program.getUniformLocation(`${prefix}.color`), new Float32Array(this.color));
    gl.uniform1f(program.getUniformLocation(`${prefix}.intensity`), this.intensity);
    gl.uniform1f(program.getUniformLocation(`${prefix}.constant`), this.attenuation.constant);
    gl.uniform1f(program.getUniformLocation(`${prefix}.linear`), this.attenuation.linear);
    gl.uniform1f(program.getUniformLocation(`${prefix}.quadratic`), this.attenuation.quadratic);
  }
}
