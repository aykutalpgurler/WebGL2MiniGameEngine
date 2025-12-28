// Minimal glTF 2.0 loader (JSON + external/data URI buffers).
// Focuses on extracting a single mesh primitive with POSITION/NORMAL/TEXCOORD_0 + indices.

const COMPONENT_ARRAY = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load glTF: ${url}`);
  return await res.json();
}

function decodeDataURI(uri) {
  const base64 = uri.split(",")[1];
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function loadBuffer(uri, baseUrl) {
  if (uri.startsWith("data:")) {
    return decodeDataURI(uri);
  }

  const res = await fetch(baseUrl + uri);
  if (!res.ok) throw new Error(`Failed to load glTF buffer: ${uri}`);
  const arrBuf = await res.arrayBuffer();
  return new Uint8Array(arrBuf);
}

function readAccessor(gltf, accessorIndex, buffers) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const BufferType = COMPONENT_ARRAY[accessor.componentType];
  if (!BufferType) throw new Error(`Unsupported glTF componentType: ${accessor.componentType}`);

  const numComponents = TYPE_COMPONENTS[accessor.type];
  const byteOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const byteLength = accessor.count * numComponents * BufferType.BYTES_PER_ELEMENT;

  const buffer = buffers[view.buffer];
  const typed = new BufferType(buffer.buffer, buffer.byteOffset + byteOffset, byteLength / BufferType.BYTES_PER_ELEMENT);
  return typed;
}

function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const ax = positions[i1] - positions[i0];
    const ay = positions[i1 + 1] - positions[i0 + 1];
    const az = positions[i1 + 2] - positions[i0 + 2];

    const bx = positions[i2] - positions[i0];
    const by = positions[i2 + 1] - positions[i0 + 1];
    const bz = positions[i2 + 2] - positions[i0 + 2];

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
    normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
    normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const x = normals[i], y = normals[i + 1], z = normals[i + 2];
    const len = Math.hypot(x, y, z) || 1;
    normals[i] = x / len;
    normals[i + 1] = y / len;
    normals[i + 2] = z / len;
  }

  return normals;
}

export async function loadGLTF(url) {
  const gltf = await fetchJSON(url);
  const baseUrl = url.slice(0, url.lastIndexOf("/") + 1);

  const buffers = [];
  for (const buf of gltf.buffers || []) {
    buffers.push(await loadBuffer(buf.uri, baseUrl));
  }

  return parseGLTF(gltf, buffers);
}

export function parseGLTF(gltf, buffers) {
  const mesh = gltf.meshes?.[0];
  const prim = mesh?.primitives?.[0];
  if (!prim) throw new Error("No mesh primitives found in glTF.");

  const positions = readAccessor(gltf, prim.attributes.POSITION, buffers);
  let normals = prim.attributes.NORMAL != null
    ? readAccessor(gltf, prim.attributes.NORMAL, buffers)
    : null;
  const uvs = prim.attributes.TEXCOORD_0 != null
    ? readAccessor(gltf, prim.attributes.TEXCOORD_0, buffers)
    : null;

  let indices = prim.indices != null
    ? readAccessor(gltf, prim.indices, buffers)
    : null;

  if (!indices) {
    const count = positions.length / 3;
    indices = new Uint16Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }

  if (!normals) {
    normals = computeNormals(positions, indices);
  }

  return {
    positions: Array.from(positions),
    normals: Array.from(normals),
    uvs: uvs ? Array.from(uvs) : null,
    indices: Array.from(indices)
  };
}
