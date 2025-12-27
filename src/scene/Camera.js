export class Camera {
  constructor(fovDeg, aspect, near, far) {
    if (!window.mat4 || !window.vec3) {
      throw new Error("gl-matrix globals not found: expected window.mat4 and window.vec3");
    }

    this.mat4 = window.mat4;
    this.vec3 = window.vec3;

    this.position = this.vec3.fromValues(0, 0, 3);
    this.target   = this.vec3.fromValues(0, 0, 0);
    this.up       = this.vec3.fromValues(0, 1, 0);

    this.fovRad = (fovDeg * Math.PI) / 180;
    this.near = near;
    this.far = far;

    this.projectionMatrix = this.mat4.create();
    this.viewMatrix = this.mat4.create();

    this.mat4.perspective(this.projectionMatrix, this.fovRad, aspect, this.near, this.far);
    this.updateView();
  }

  updateView() {
    this.mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
  }

  resize(aspect) {
    this.mat4.perspective(this.projectionMatrix, this.fovRad, aspect, this.near, this.far);
  }
}
