const mat4 = window.mat4;
if (!mat4) {
  throw new Error("gl-matrix not loaded (expected window.mat4)");
}

export function createTransform() {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  };
}

export function cloneTransform(t) {
  return {
    position: { ...t.position },
    rotation: { ...t.rotation },
    scale: { ...t.scale }
  };
}

export function composeTransform(out, t) {
  const m = out || mat4.create();
  mat4.identity(m);

  mat4.translate(m, m, [t.position.x, t.position.y, t.position.z]);
  mat4.rotateX(m, m, t.rotation.x);
  mat4.rotateY(m, m, t.rotation.y);
  mat4.rotateZ(m, m, t.rotation.z);
  mat4.scale(m, m, [t.scale.x, t.scale.y, t.scale.z]);

  return m;
}

export function getForwardVector(t) {
  // forward = -Z after applying rotation
  const m = composeTransform(mat4.create(), t);
  // negative Z axis in local space
  return [-m[8], -m[9], -m[10]];
}
