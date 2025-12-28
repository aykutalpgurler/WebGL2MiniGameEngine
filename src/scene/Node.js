import { createTransform, composeTransform, cloneTransform } from "../math/transform.js";

export class Node {
  constructor(name = "Node") {
    if (!window.mat4) throw new Error("gl-matrix not loaded (expected window.mat4)");

    this.name = name;
    this.transform = createTransform();
    this.worldMatrix = window.mat4.create();

    this.parent = null;
    this.children = [];
    this.visible = true;
  }

  addChild(child) {
    if (!child) return child;
    if (child.parent) child.parent.removeChild(child);
    this.children.push(child);
    child.parent = this;
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  updateWorldMatrix(parentMatrix = null) {
    composeTransform(this.worldMatrix, this.transform);
    if (parentMatrix) {
      window.mat4.multiply(this.worldMatrix, parentMatrix, this.worldMatrix);
    }

    for (const c of this.children) {
      c.updateWorldMatrix(this.worldMatrix);
    }
  }

  traverse(fn) {
    fn(this);
    for (const c of this.children) c.traverse(fn);
  }

  clone() {
    const copy = new Node(this.name);
    copy.transform = cloneTransform(this.transform);
    copy.visible = this.visible;
    // mesh/material references (if any) will be set by subclasses
    for (const c of this.children) {
      const childClone = c.clone ? c.clone() : c;
      copy.addChild(childClone);
    }
    return copy;
  }
}
