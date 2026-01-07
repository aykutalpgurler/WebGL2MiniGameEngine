export class Mesh {
  constructor(gl, { positions, normals, uvs, colors, indices }) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    this.indexCount = indices.length;
    this.indexType = gl.UNSIGNED_SHORT;
    this._useUint32 = false;

    gl.bindVertexArray(this.vao);

    // position (location=0)
    this._bindVBO(0, 3, positions);

    // normal (location=1)
    if (normals) this._bindVBO(1, 3, normals);

    // uv (location=2)
    if (uvs) this._bindVBO(2, 2, uvs);

    // color (location=3) optional debug
    if (colors) this._bindVBO(3, 3, colors);

    // index buffer (auto-select 16-bit vs 32-bit)
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    let maxIndex = 0;
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      if (idx > maxIndex) maxIndex = idx;
    }
    if (maxIndex > 65535) {
      this.indexType = gl.UNSIGNED_INT;
      this._useUint32 = true;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    } else {
      this.indexType = gl.UNSIGNED_SHORT;
      this._useUint32 = false;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

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
    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
    gl.bindVertexArray(null);
  }
}
