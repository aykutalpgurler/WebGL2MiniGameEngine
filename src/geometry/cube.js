export function createCube() {
  // 8 vertices
  const positions = [
    -0.5, -0.5,  0.5, // 0
     0.5, -0.5,  0.5, // 1
     0.5,  0.5,  0.5, // 2
    -0.5,  0.5,  0.5, // 3
    -0.5, -0.5, -0.5, // 4
     0.5, -0.5, -0.5, // 5
     0.5,  0.5, -0.5, // 6
    -0.5,  0.5, -0.5  // 7
  ];

  // per-vertex color (şimdilik debug amaçlı)
  const colors = [
    1,0,0,  0,1,0,  0,0,1,  1,1,0,
    1,0,1,  0,1,1,  1,1,1,  0.5,0.5,0.5
  ];

  // 12 triangles (36 indices)
  const indices = [
    // front
    0,1,2, 0,2,3,
    // right
    1,5,6, 1,6,2,
    // back
    5,4,7, 5,7,6,
    // left
    4,0,3, 4,3,7,
    // top
    3,2,6, 3,6,7,
    // bottom
    4,5,1, 4,1,0
  ];

  return { positions, colors, indices };
}
