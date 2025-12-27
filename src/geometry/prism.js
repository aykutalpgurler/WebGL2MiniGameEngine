// src/geometry/prism.js
export function createPrism({
  radius = 0.5,
  height = 1.0
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const colors = [];

  const halfH = height / 2;

  // Base triangle on XZ plane (counter-clockwise when looking from +Y)
  const p0 = [radius, 0, 0];
  const p1 = [radius * Math.cos((2 * Math.PI) / 3), 0, radius * Math.sin((2 * Math.PI) / 3)];
  const p2 = [radius * Math.cos((4 * Math.PI) / 3), 0, radius * Math.sin((4 * Math.PI) / 3)];

  const bottom = (p) => [p[0], -halfH, p[2]];
  const top = (p) => [p[0], +halfH, p[2]];

  function pushV(pos, nrm, uv) {
    positions.push(pos[0], pos[1], pos[2]);
    normals.push(nrm[0], nrm[1], nrm[2]);
    uvs.push(uv[0], uv[1]);
    colors.push(0.7, 0.7, 0.7);
  }

  function faceNormal(a, b, c) {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    const cx = c[0], cy = c[1], cz = c[2];

    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;

    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    const len = Math.hypot(nx, ny, nz) || 1.0;
    return [nx / len, ny / len, nz / len];
  }

  // --- Side faces (3 rectangles -> 2 tris each) ---
  const basePts = [p0, p1, p2];
  for (let i = 0; i < 3; i++) {
    const a = basePts[i];
    const b = basePts[(i + 1) % 3];

    const aB = bottom(a);
    const bB = bottom(b);
    const bT = top(b);
    const aT = top(a);

    const n = faceNormal(aB, bB, bT);

    const start = positions.length / 3;

    // UVs: u along edge, v along height
    pushV(aB, n, [0, 1]);
    pushV(bB, n, [1, 1]);
    pushV(bT, n, [1, 0]);
    pushV(aT, n, [0, 0]);

    indices.push(start + 0, start + 1, start + 2);
    indices.push(start + 0, start + 2, start + 3);
  }

  // --- Top cap (triangle) ---
  {
    const a = top(p0), b = top(p1), c = top(p2);
    const n = [0, 1, 0];
    const start = positions.length / 3;

    // simple planar UV projection
    pushV(a, n, [0.5 + a[0] / (2 * radius), 0.5 - a[2] / (2 * radius)]);
    pushV(b, n, [0.5 + b[0] / (2 * radius), 0.5 - b[2] / (2 * radius)]);
    pushV(c, n, [0.5 + c[0] / (2 * radius), 0.5 - c[2] / (2 * radius)]);

    indices.push(start + 0, start + 1, start + 2);
  }

  // --- Bottom cap (triangle) ---
  {
    const a = bottom(p0), b = bottom(p1), c = bottom(p2);
    const n = [0, -1, 0];
    const start = positions.length / 3;

    pushV(a, n, [0.5 + a[0] / (2 * radius), 0.5 + a[2] / (2 * radius)]);
    pushV(b, n, [0.5 + b[0] / (2 * radius), 0.5 + b[2] / (2 * radius)]);
    pushV(c, n, [0.5 + c[0] / (2 * radius), 0.5 + c[2] / (2 * radius)]);

    // reverse winding to face outward
    indices.push(start + 0, start + 2, start + 1);
  }

  return { positions, normals, uvs, colors, indices };
}
