import { Light } from "./Light.js";

export class DirectionalLight extends Light {
  constructor(direction = [0, -1, 0], color = [1, 1, 1], intensity = 1.0) {
    super(color, intensity);
    this.direction = direction;
  }

  apply(gl, program, prefix = "uDirLight") {
    if (!program?.getUniformLocation) return;

    gl.uniform3fv(program.getUniformLocation(`${prefix}.direction`), new Float32Array(this.direction));
    gl.uniform3fv(program.getUniformLocation(`${prefix}.color`), new Float32Array(this.color));
    gl.uniform1f(program.getUniformLocation(`${prefix}.intensity`), this.intensity);
  }
}
