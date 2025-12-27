// src/geometry/PrimitiveFactory.js
import { createCube } from "./cube.js";
import { createSphere } from "./sphere.js";
import { createCylinder } from "./cylinder.js";
import { createPrism } from "./prism.js";

export const PrimitiveFactory = {
  createCube() {
    return createCube();
  },

  createSphere(params = {}) {
    return createSphere(params);
  },

  createCylinder(params = {}) {
    return createCylinder(params);
  },

  createPrism(params = {}) {
    return createPrism(params);
  }
};
