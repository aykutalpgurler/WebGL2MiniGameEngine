// src/ui/GUI.js
export class GUIController {
  constructor() {
    this.gui = null;
  }

  init(params) {
    // expects window.lil.GUI (from vendor/lil-gui.min.js)
    const GUI = window.lil?.GUI;
    if (!GUI) throw new Error("lil-gui not found on window.lil.GUI");

    const {
      state,
      onSelectMeshType,
      onToggleTexture
    } = params;

    this.gui = new GUI({ title: "Mini Engine" });

    // ---- Scene / Object ----
    const fScene = this.gui.addFolder("Scene");
    fScene.add(state, "meshType", ["OBJ", "Cube", "Sphere", "Cylinder", "Prism"])
      .name("Mesh")
      .onChange((v) => onSelectMeshType(v));

    fScene.add(state, "useTexture").name("Use Texture").onChange((v) => onToggleTexture(v));
    fScene.add(state, "useBlinnPhong").name("Use Blinn-Phong");

    // ---- Transform ----
    const fTr = this.gui.addFolder("Transform");

    fTr.add(state.transform.position, "x", -5, 5, 0.01).name("pos.x");
    fTr.add(state.transform.position, "y", -5, 5, 0.01).name("pos.y");
    fTr.add(state.transform.position, "z", -5, 5, 0.01).name("pos.z");

    fTr.add(state.transform.rotation, "x", -Math.PI, Math.PI, 0.01).name("rot.x");
    fTr.add(state.transform.rotation, "y", -Math.PI, Math.PI, 0.01).name("rot.y");
    fTr.add(state.transform.rotation, "z", -Math.PI, Math.PI, 0.01).name("rot.z");

    fTr.add(state.transform.scale, "x", 0.01, 3, 0.01).name("scale.x");
    fTr.add(state.transform.scale, "y", 0.01, 3, 0.01).name("scale.y");
    fTr.add(state.transform.scale, "z", 0.01, 3, 0.01).name("scale.z");

    // ---- Lights ----
    const fDir = this.gui.addFolder("Directional Light");
    fDir.add(state.dirLight.direction, "x", -1, 1, 0.01).name("dir.x");
    fDir.add(state.dirLight.direction, "y", -1, 1, 0.01).name("dir.y");
    fDir.add(state.dirLight.direction, "z", -1, 1, 0.01).name("dir.z");
    fDir.add(state.dirLight, "intensity", 0, 5, 0.01).name("intensity");

    const fPoint = this.gui.addFolder("Point Light");
    fPoint.add(state.pointLight.position, "x", -5, 5, 0.01).name("pos.x");
    fPoint.add(state.pointLight.position, "y", -5, 5, 0.01).name("pos.y");
    fPoint.add(state.pointLight.position, "z", -5, 5, 0.01).name("pos.z");
    fPoint.add(state.pointLight, "intensity", 0, 10, 0.01).name("intensity");
    fPoint.add(state.pointLight, "constant", 0.1, 2.0, 0.01).name("constant");
    fPoint.add(state.pointLight, "linear", 0.0, 1.0, 0.01).name("linear");
    fPoint.add(state.pointLight, "quadratic", 0.0, 1.0, 0.01).name("quadratic");

    // ---- Material ----
    const fMat = this.gui.addFolder("Material");
    fMat.add(state.material.ka, "x", 0, 1, 0.01).name("Ka.r");
    fMat.add(state.material.ka, "y", 0, 1, 0.01).name("Ka.g");
    fMat.add(state.material.ka, "z", 0, 1, 0.01).name("Ka.b");

    fMat.add(state.material.ks, "x", 0, 1, 0.01).name("Ks.r");
    fMat.add(state.material.ks, "y", 0, 1, 0.01).name("Ks.g");
    fMat.add(state.material.ks, "z", 0, 1, 0.01).name("Ks.b");

    fMat.add(state.material, "shininess", 1, 256, 1).name("shininess");

    fScene.open();
    fTr.open();
    fDir.open();
    fPoint.open();
    fMat.open();
  }
}
