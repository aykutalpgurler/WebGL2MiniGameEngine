export class Renderer {
  constructor(gl) {
    this.gl = gl;
  }

  resize(width, height) {
    this.gl.viewport(0, 0, width, height);
  }

  beginFrame() {
    const gl = this.gl;
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  endFrame() {
    // şimdilik boş
  }
}
