export function createCube() {
  // 24 vertices (4 per face) so each face has correct constant normal
  const positions = [
    // +Z (front)
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // -Z (back)
     0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
    // +X (right)
     0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
    // -X (left)
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    // +Y (top)
    -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
    // -Y (bottom)
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5
  ];

  const normals = [
    // +Z
     0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
    // -Z
     0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,
    // +X
     1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
    // -X
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    // +Y
     0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
    // -Y
     0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0
  ];

  // UV for each face (for later texture mapping)
  const uvs = [
    // +Z
    0,0,  1,0,  1,1,  0,1,
    // -Z
    0,0,  1,0,  1,1,  0,1,
    // +X
    0,0,  1,0,  1,1,  0,1,
    // -X
    0,0,  1,0,  1,1,  0,1,
    // +Y
    0,0,  1,0,  1,1,  0,1,
    // -Y
    0,0,  1,0,  1,1,  0,1
  ];

  // simple debug colors (per-vertex), keep it for now
  const colors = [];
  for (let i = 0; i < 24; i++) {
    // repeat a palette
    const t = (i % 4) / 3;
    colors.push(1.0 - t, t, 0.5);
  }

  const indices = [
     0, 1, 2,   0, 2, 3,     // front
     4, 5, 6,   4, 6, 7,     // back
     8, 9,10,   8,10,11,     // right
    12,13,14,  12,14,15,     // left
    16,17,18,  16,18,19,     // top
    20,21,22,  20,22,23      // bottom
  ];

  return { positions, normals, uvs, colors, indices };
}
