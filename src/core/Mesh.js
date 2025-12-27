export class Mesh {
  constructor(gl, { positions, colors }) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    this.vertexCount = positions.length / 3;

    gl.bindVertexArray(this.vao);

    // position VBO (location=0)
    this.posVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // color VBO (location=1)
    this.colVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    gl.bindVertexArray(null);
  }
}
