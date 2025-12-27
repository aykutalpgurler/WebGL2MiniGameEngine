// src/geometry/cylinder.js
export function createCylinder({
  radius = 0.5,
  height = 1.0,
  radialSegments = 32,
  capSegments = 1 // (1 is enough; kept for extensibility)
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const colors = [];

  const halfH = height / 2;

  // ---- Side vertices ----
  // We create (radialSegments+1) for seam
  const sideStart = 0;
  for (let i = 0; i <= radialSegments; i++) {
    const u = i / radialSegments;
    const ang = u * Math.PI * 2;

    const x = Math.cos(ang) * radius;
    const z = Math.sin(ang) * radius;

    // bottom
    positions.push(x, -halfH, z);
    normals.push(Math.cos(ang), 0, Math.sin(ang));
    uvs.push(u, 1.0);
    colors.push(0.7, 0.7, 0.7);

    // top
    positions.push(x, +halfH, z);
    normals.push(Math.cos(ang), 0, Math.sin(ang));
    uvs.push(u, 0.0);
    colors.push(0.7, 0.7, 0.7);
  }

  // Side indices
  for (let i = 0; i < radialSegments; i++) {
    const a = sideStart + i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    indices.push(a, b, c);
    indices.push(c, b, d);
  }

  // ---- Top cap ----
  const topCenterIndex = positions.length / 3;
  positions.push(0, +halfH, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);
  colors.push(0.7, 0.7, 0.7);

  const topRingStart = positions.length / 3;
  for (let i = 0; i <= radialSegments; i++) {
    const u = i / radialSegments;
    const ang = u * Math.PI * 2;
    const x = Math.cos(ang) * radius;
    const z = Math.sin(ang) * radius;

    positions.push(x, +halfH, z);
    normals.push(0, 1, 0);

    // planar UV
    uvs.push(0.5 + (x / (2 * radius)), 0.5 - (z / (2 * radius)));
    colors.push(0.7, 0.7, 0.7);
  }

  for (let i = 0; i < radialSegments; i++) {
    const v0 = topRingStart + i;
    const v1 = topRingStart + i + 1;
    indices.push(topCenterIndex, v0, v1);
  }

  // ---- Bottom cap ----
  const botCenterIndex = positions.length / 3;
  positions.push(0, -halfH, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);
  colors.push(0.7, 0.7, 0.7);

  const botRingStart = positions.length / 3;
  for (let i = 0; i <= radialSegments; i++) {
    const u = i / radialSegments;
    const ang = u * Math.PI * 2;
    const x = Math.cos(ang) * radius;
    const z = Math.sin(ang) * radius;

    positions.push(x, -halfH, z);
    normals.push(0, -1, 0);

    uvs.push(0.5 + (x / (2 * radius)), 0.5 + (z / (2 * radius)));
    colors.push(0.7, 0.7, 0.7);
  }

  for (let i = 0; i < radialSegments; i++) {
    const v0 = botRingStart + i;
    const v1 = botRingStart + i + 1;
    // reverse winding so it faces outward
    indices.push(botCenterIndex, v1, v0);
  }

  return { positions, normals, uvs, colors, indices };
}
