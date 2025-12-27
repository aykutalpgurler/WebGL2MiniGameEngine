export class Mesh {
  constructor(gl, { positions, normals, uvs, colors, indices }) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    this.indexCount = indices.length;

    gl.bindVertexArray(this.vao);

    // position (location=0)
    this._bindVBO(0, 3, positions);

    // normal (location=1)
    if (normals) this._bindVBO(1, 3, normals);

    // uv (location=2)
    if (uvs) this._bindVBO(2, 2, uvs);

    // color (location=3) optional debug
    if (colors) this._bindVBO(3, 3, colors);

    // index buffer
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  _bindVBO(location, size, data) {
    const gl = this.gl;
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}
