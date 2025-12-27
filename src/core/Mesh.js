export class Mesh {
  constructor(gl, { positions, colors, indices }) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    this.indexCount = indices.length;

    gl.bindVertexArray(this.vao);

    // position (location = 0)
    const posVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // color (location = 1)
    const colVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    // index buffer
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}
