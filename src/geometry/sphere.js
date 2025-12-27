// src/geometry/sphere.js
export function createSphere({
  radius = 0.5,
  latBands = 24,
  lonBands = 32
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const colors = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const v = lat / latBands;
    const theta = v * Math.PI; // 0..PI

    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonBands; lon++) {
      const u = lon / lonBands;
      const phi = u * Math.PI * 2; // 0..2PI

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const nx = cosPhi * sinTheta;
      const ny = cosTheta;
      const nz = sinPhi * sinTheta;

      const px = radius * nx;
      const py = radius * ny;
      const pz = radius * nz;

      positions.push(px, py, pz);
      normals.push(nx, ny, nz);

      // Standard UV (u right, v up)
      uvs.push(u, 1.0 - v);

      // debug color (optional)
      colors.push(0.7, 0.7, 0.7);
    }
  }

  // indices
  const stride = lonBands + 1;
  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const i0 = lat * stride + lon;
      const i1 = i0 + 1;
      const i2 = i0 + stride;
      const i3 = i2 + 1;

      // two triangles
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  return { positions, normals, uvs, colors, indices };
}
