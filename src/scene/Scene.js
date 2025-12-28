import { Node } from "./Node.js";

export class Scene {
  constructor() {
    this.root = new Node("Root");
    this.entities = [];
    this.directionalLights = [];
    this.pointLights = [];
    this.background = [0.08, 0.08, 0.1, 1.0];
  }

  setBackground(color) {
    this.background = color;
  }

  addEntity(entity) {
    if (!entity) return entity;
    this.entities.push(entity);
    this.root.addChild(entity);
    return entity;
  }

  removeEntity(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) this.entities.splice(idx, 1);
    this.root.removeChild(entity);
  }

  addDirectionalLight(light) {
    this.directionalLights.push(light);
    return light;
  }

  addPointLight(light) {
    this.pointLights.push(light);
    return light;
  }

  updateWorldMatrices() {
    this.root.updateWorldMatrix();
  }

  draw(gl, program) {
    this.updateWorldMatrices();

    gl.clearColor(...this.background);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Apply only first lights by default; caller can handle more manually.
    this.directionalLights[0]?.apply(gl, program, "uDirLight");
    this.pointLights[0]?.apply(gl, program, "uPointLight");

    for (const e of this.entities) {
      e.draw(gl, program);
    }
  }
}
