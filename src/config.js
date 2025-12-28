export const CONFIG = {
  canvasId: "glCanvas",

  camera: {
    fov: 60,
    near: 0.1,
    far: 100
  },

  clearColor: [0.08, 0.08, 0.1, 1.0],

  controls: {
    firstPerson: {
      moveSpeed: 2.5,
      sprintMultiplier: 2.0
    },
    thirdPerson: {
      defaultDistance: 5.0
    }
  }
};

export function resolveAssetPath(path) {
  // Utility to keep asset paths consistent if the project is moved under a subdirectory.
  if (!path.startsWith("./") && !path.startsWith("/")) {
    return `./${path}`;
  }
  return path;
}
