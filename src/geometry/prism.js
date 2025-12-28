export function createPrism({
  radius = 0.5,
  height = 1.0,
  segments = 3 // 3: Triangular, 6: Hexagonal [cite: 22]
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const halfH = height / 2;

  // Yardımcı fonksiyon: Vertex ekleme
  function addVertex(x, y, z, nx, ny, nz, u, v) {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    uvs.push(u, v);
  }

  // 1. Yan Yüzeyler (Side Faces)
  // Her yüzey için 4 vertex (2 üçgen) oluşturuyoruz (Flat Shading için) [cite: 72, 73]
  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI * 2;
    const theta2 = ((i + 1) / segments) * Math.PI * 2;

    const x1 = radius * Math.cos(theta1);
    const z1 = radius * Math.sin(theta1);
    const x2 = radius * Math.cos(theta2);
    const z2 = radius * Math.sin(theta2);

    // Yüzey normalini hesapla (XZ düzleminde dışa doğru) [cite: 26, 72]
    const midTheta = (theta1 + theta2) / 2;
    const nx = Math.cos(midTheta);
    const nz = Math.sin(midTheta);

    const startIdx = positions.length / 3;

    // Alt sol, alt sağ, üst sağ, üst sol
    addVertex(x1, -halfH, z1, nx, 0, nz, i / segments, 1);
    addVertex(x2, -halfH, z2, nx, 0, nz, (i + 1) / segments, 1);
    addVertex(x2, halfH, z2, nx, 0, nz, (i + 1) / segments, 0);
    addVertex(x1, halfH, z1, nx, 0, nz, i / segments, 0);

    indices.push(startIdx, startIdx + 1, startIdx + 2);
    indices.push(startIdx, startIdx + 2, startIdx + 3);
  }

  // 2. Üst Kapak (Top Cap)
  const topStartIdx = positions.length / 3;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    // Normal yukarı bakmalı [cite: 73]
    addVertex(x, halfH, z, 0, 1, 0, 0.5 + x / (2 * radius), 0.5 + z / (2 * radius));
  }
  // Fan şeklinde indexleme
  for (let i = 1; i < segments - 1; i++) {
    indices.push(topStartIdx, topStartIdx + i, topStartIdx + i + 1);
  }

  // 3. Alt Kapak (Bottom Cap)
  const botStartIdx = positions.length / 3;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    // Normal aşağı bakmalı [cite: 73]
    addVertex(x, -halfH, z, 0, -1, 0, 0.5 + x / (2 * radius), 0.5 + z / (2 * radius));
  }
  // Fan şeklinde indexleme (Saat yönünün tersi / CCW için i+1, i sırası)
  for (let i = 1; i < segments - 1; i++) {
    indices.push(botStartIdx, botStartIdx + i + 1, botStartIdx + i);
  }

  return { positions, normals, uvs, indices };
}