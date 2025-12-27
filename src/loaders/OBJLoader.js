// src/loaders/OBJLoader.js
// Supports: v, vt, vn, f (tri/quad/ngon -> triangulated)
// Handles OBJ "separate indices" by building unified vertex buffers.

function parseIndex(idxStr, length) {
  // OBJ indices are 1-based, negatives allowed (relative)
  const i = parseInt(idxStr, 10);
  if (Number.isNaN(i)) return null;
  return i >= 0 ? (i - 1) : (length + i);
}

function addVec3(arr, x, y, z) {
  arr.push(x, y, z);
}
function addVec2(arr, u, v) {
  arr.push(u, v);
}

export async function loadOBJ(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load OBJ: ${url}`);
  const text = await res.text();
  return parseOBJ(text);
}

export function parseOBJ(objText) {
  const positionsRaw = []; // [[x,y,z], ...]
  const normalsRaw = [];
  const uvsRaw = [];

  // unified buffers
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  // map "v/vt/vn" -> newIndex
  const vertMap = new Map();

  const lines = objText.split("\n");

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const tag = parts[0];

    if (tag === "v") {
      positionsRaw.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (tag === "vn") {
      normalsRaw.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (tag === "vt") {
      // keep only u,v ; some OBJs have vt u v w
      uvsRaw.push([parseFloat(parts[1]), parseFloat(parts[2])]);
    } else if (tag === "f") {
      // face tokens: v, v/vt, v//vn, v/vt/vn
      const faceVerts = parts.slice(1);

      // triangulate fan: (0, i, i+1)
      for (let i = 1; i + 1 < faceVerts.length; i++) {
        const tri = [faceVerts[0], faceVerts[i], faceVerts[i + 1]];
        for (const vtn of tri) {
          const key = vtn;
          if (vertMap.has(key)) {
            indices.push(vertMap.get(key));
            continue;
          }

          const comps = vtn.split("/");
          const vStr = comps[0];
          const vtStr = comps.length > 1 ? comps[1] : "";
          const vnStr = comps.length > 2 ? comps[2] : "";

          const vIndex = parseIndex(vStr, positionsRaw.length);
          const vtIndex = vtStr ? parseIndex(vtStr, uvsRaw.length) : null;
          const vnIndex = vnStr ? parseIndex(vnStr, normalsRaw.length) : null;

          if (vIndex == null || !positionsRaw[vIndex]) {
            throw new Error(`OBJ parse error: invalid vertex index in "${vtn}"`);
          }

          const p = positionsRaw[vIndex];
          addVec3(positions, p[0], p[1], p[2]);

          if (vtIndex != null && uvsRaw[vtIndex]) {
            const t = uvsRaw[vtIndex];
            // Many OBJ UVs assume origin bottom-left; WebGL textures often top-left.
            // We'll flip V here for convenience.
            addVec2(uvs, t[0], 1.0 - t[1]);
          } else {
            addVec2(uvs, 0.0, 0.0);
          }

          if (vnIndex != null && normalsRaw[vnIndex]) {
            const n = normalsRaw[vnIndex];
            addVec3(normals, n[0], n[1], n[2]);
          } else {
            // if OBJ has no normals, put placeholder; later we can compute normals
            addVec3(normals, 0.0, 0.0, 1.0);
          }

          const newIndex = (positions.length / 3) - 1;
          vertMap.set(key, newIndex);
          indices.push(newIndex);
        }
      }
    }
  }

  // If normals were missing, you'd ideally compute them. For now, we only compute if ALL normals are placeholders.
  // Simple check: if normalsRaw empty, compute smooth normals.
  if (normalsRaw.length === 0) {
    computeNormals(positions, indices, normals);
  }

  return {
    positions,
    normals,
    uvs,
    indices
  };
}

function computeNormals(positions, indices, outNormals) {
  // positions: flat array
  // outNormals: flat array (will be overwritten)
  outNormals.length = positions.length;
  outNormals.fill(0);

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const x0 = positions[i0],     y0 = positions[i0 + 1],     z0 = positions[i0 + 2];
    const x1 = positions[i1],     y1 = positions[i1 + 1],     z1 = positions[i1 + 2];
    const x2 = positions[i2],     y2 = positions[i2 + 1],     z2 = positions[i2 + 2];

    const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
    const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;

    // cross(a, b)
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    outNormals[i0]     += nx; outNormals[i0 + 1] += ny; outNormals[i0 + 2] += nz;
    outNormals[i1]     += nx; outNormals[i1 + 1] += ny; outNormals[i1 + 2] += nz;
    outNormals[i2]     += nx; outNormals[i2 + 1] += ny; outNormals[i2 + 2] += nz;
  }

  // normalize
  for (let i = 0; i < outNormals.length; i += 3) {
    const x = outNormals[i], y = outNormals[i + 1], z = outNormals[i + 2];
    const len = Math.hypot(x, y, z) || 1.0;
    outNormals[i] = x / len;
    outNormals[i + 1] = y / len;
    outNormals[i + 2] = z / len;
  }
}
