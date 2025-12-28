import { Node } from "./Node.js";
import { cloneTransform } from "../math/transform.js";

export class Entity extends Node {
  constructor(name = "Entity", mesh = null, material = null) {
    super(name);
    this.mesh = mesh;
    this.material = material;
  }

  setMesh(mesh) {
    this.mesh = mesh;
    return this;
  }

  setMaterial(material) {
    this.material = material;
    return this;
  }

  draw(gl, program) {
    if (!this.visible || !this.mesh) return;

    if (this.material?.apply) {
      this.material.apply(gl, program);
    }

    if (program?.getUniformLocation) {
      gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, this.worldMatrix);
    }

    this.mesh.draw();
  }

  clone() {
    const copy = new Entity(this.name, this.mesh, this.material);
    copy.transform = cloneTransform(this.transform);
    copy.visible = this.visible;
    for (const c of this.children) {
      copy.addChild(c.clone ? c.clone() : c);
    }
    return copy;
  }
}
