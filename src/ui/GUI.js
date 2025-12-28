// src/ui/GUI.js
export class GUIController {
  constructor() {
    this.gui = null;

    this.state = null;
    this.meshTypes = null;

    this.getEntities = null;
    this.getActiveEntity = null;

    this.onSelectActive = null;
    this.onAddEntity = null;
    this.onRemoveActive = null;
    this.onUploadOBJ = null;
    this.onUploadTexture = null;          // NEW
    this.onChangeActiveMeshType = null;

    this._activeEntity = null;

    this._activeProxy = { active: "" };
    this._activeDropdown = null;

    this._activeFolder = null;       // "Active Object"
    this._transformFolder = null;    // inside active folder
    this._meshFolder = null;         // inside active folder
    this._textureNameCtrl = null;   // controller for Current Texture display
  }

  init({
    state,
    meshTypes,
    getEntities,
    getActiveEntity,
    onSelectActive,
    onAddEntity,
    onRemoveActive,
    onUploadOBJ,
    onUploadTexture,                 // NEW
    onChangeActiveMeshType
  }) {
    this.state = state;
    this.meshTypes = meshTypes || ["OBJ", "Cube", "Sphere", "Cylinder", "Prism"];

    this.getEntities = getEntities;
    this.getActiveEntity = getActiveEntity;

    this.onSelectActive = onSelectActive;
    this.onAddEntity = onAddEntity;
    this.onRemoveActive = onRemoveActive;
    this.onUploadOBJ = onUploadOBJ;
    this.onUploadTexture = onUploadTexture;   // NEW
    this.onChangeActiveMeshType = onChangeActiveMeshType;

    const GUI = window.lil?.GUI;
    if (!GUI) throw new Error("lil-gui not found on window.lil.GUI");

    this.gui = new GUI({ title: "Mini Engine" });

    // Ensure these exist (so GUI won't crash)
    if (this.state.spawnType === undefined) this.state.spawnType = "OBJ";
    if (this.state.textureName === undefined) this.state.textureName = "default";

    // ---------------- Scene ----------------
    const fScene = this.gui.addFolder("Scene");

    // Upload OBJ
    fScene.add({ uploadOBJ: () => this._triggerOBJInput() }, "uploadOBJ").name("📁 Upload OBJ");

    // Upload Texture (NEW)
    fScene.add({ uploadTex: () => this._triggerTextureInput() }, "uploadTex").name("🖼️ Upload Texture");

    // Show current texture name (read-only display)
    this._textureNameCtrl = fScene.add(this.state, "textureName").name("Current Texture").listen();
    this._textureNameCtrl.disable();

    // Spawn type selector + add
    fScene.add(this.state, "spawnType", this.meshTypes).name("Spawn Type");
    fScene
      .add({ add: () => this.onAddEntity && this.onAddEntity(this.state.spawnType) }, "add")
      .name("Add Entity");

    // Quick add buttons
    const quick = fScene.addFolder("Quick Add");
    quick.add({ cube: () => this.onAddEntity && this.onAddEntity("Cube") }, "cube").name("Add Cube");
    quick.add({ sphere: () => this.onAddEntity && this.onAddEntity("Sphere") }, "sphere").name("Add Sphere");
    quick.add({ cylinder: () => this.onAddEntity && this.onAddEntity("Cylinder") }, "cylinder").name("Add Cylinder");
    quick.add({ prism: () => this.onAddEntity && this.onAddEntity("Prism") }, "prism").name("Add Prism");

    // Remove
    fScene.add({ remove: () => this.onRemoveActive && this.onRemoveActive() }, "remove").name("Remove Active");

    // Active dropdown
    const opts = this._buildEntityOptions();
    this._activeProxy.active = this._pickDefaultActiveId(opts);
    this._activeDropdown = fScene
      .add(this._activeProxy, "active", opts)
      .name("Active Object")
      .onChange((id) => this.onSelectActive && this.onSelectActive(id));

    // Render toggles
    fScene.add(this.state, "useTexture").name("Use Texture");
    fScene.add(this.state, "useBlinnPhong").name("Use Blinn-Phong");

    // Animation
    const fAnim = fScene.addFolder("Animation");
    fAnim.add(this.state, "autoRotateActive").name("Auto-rotate Active");
    fAnim.add(this.state, "rotateSpeed", 0.0, 5.0, 0.01).name("Rotate Speed");

    fScene.open();

    // ---------------- Active Object ----------------
    this._activeFolder = this.gui.addFolder("Active Object");
    this._activeFolder.open();

    // ---------------- Lights ----------------
    const fDir = this.gui.addFolder("Directional Light");
    fDir.add(this.state.dirLight.direction, "x", -1, 1, 0.01).name("dir.x");
    fDir.add(this.state.dirLight.direction, "y", -1, 1, 0.01).name("dir.y");
    fDir.add(this.state.dirLight.direction, "z", -1, 1, 0.01).name("dir.z");
    fDir.add(this.state.dirLight, "intensity", 0, 5, 0.01).name("intensity");

    const fPoint = this.gui.addFolder("Point Light");
    fPoint.add(this.state.pointLight.position, "x", -5, 5, 0.01).name("pos.x");
    fPoint.add(this.state.pointLight.position, "y", -5, 5, 0.01).name("pos.y");
    fPoint.add(this.state.pointLight.position, "z", -5, 5, 0.01).name("pos.z");
    fPoint.add(this.state.pointLight, "intensity", 0, 10, 0.01).name("intensity");
    fPoint.add(this.state.pointLight, "constant", 0.1, 2.0, 0.01).name("constant");
    fPoint.add(this.state.pointLight, "linear", 0.0, 1.0, 0.01).name("linear");
    fPoint.add(this.state.pointLight, "quadratic", 0.0, 1.0, 0.01).name("quadratic");

    // ---------------- Material ----------------
    const fMat = this.gui.addFolder("Material");
    fMat.add(this.state.material.ka, "x", 0, 1, 0.01).name("Ka.r");
    fMat.add(this.state.material.ka, "y", 0, 1, 0.01).name("Ka.g");
    fMat.add(this.state.material.ka, "z", 0, 1, 0.01).name("Ka.b");

    fMat.add(this.state.material.ks, "x", 0, 1, 0.01).name("Ks.r");
    fMat.add(this.state.material.ks, "y", 0, 1, 0.01).name("Ks.g");
    fMat.add(this.state.material.ks, "z", 0, 1, 0.01).name("Ks.b");

    fMat.add(this.state.material, "shininess", 1, 256, 1).name("shininess");

    // init active entity UI
    this.setActiveEntity(this.getActiveEntity ? this.getActiveEntity() : null);
  }

  _triggerOBJInput() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".obj";
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file && this.onUploadOBJ) this.onUploadOBJ(file);
    };
    fileInput.click();
  }

  _triggerTextureInput() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file && this.onUploadTexture) this.onUploadTexture(file);
    };
    fileInput.click();
  }

  refreshEntities() {
    if (!this._activeDropdown) return;

    const opts = this._buildEntityOptions();
    this._activeDropdown.options(opts);

    const active = this.getActiveEntity ? this.getActiveEntity() : null;
    if (active) {
      this._activeProxy.active = active.id;
      this._activeDropdown.setValue(active.id);
    } else {
      const firstId = this._pickDefaultActiveId(opts);
      this._activeProxy.active = firstId;
      this._activeDropdown.setValue(firstId);
    }
  }

  setActiveEntity(entity) {
    this._activeEntity = entity || null;

    this._rebuildActiveMeshControls(this._activeEntity);
    this._rebuildTransformFolder(this._activeEntity);

    if (this._activeDropdown && this._activeEntity) {
      this._activeProxy.active = this._activeEntity.id;
      this._activeDropdown.setValue(this._activeEntity.id);
    }
  }

  _rebuildActiveMeshControls(entity) {
    if (this._meshFolder) {
      this._meshFolder.destroy();
      this._meshFolder = null;
    }

    this._meshFolder = this._activeFolder.addFolder("Mesh");
    if (!entity) {
      this._meshFolder.add({ info: "No active object" }, "info").name("Info");
      this._meshFolder.open();
      return;
    }

    const proxy = { meshType: entity.meshType || "OBJ" };

    this._meshFolder
      .add(proxy, "meshType", this.meshTypes)
      .name("Type")
      .onChange((v) => {
        if (this.onChangeActiveMeshType) this.onChangeActiveMeshType(v);
        const cur = this.getActiveEntity ? this.getActiveEntity() : null;
        if (cur) proxy.meshType = cur.meshType;
      });

    this._meshFolder.open();
  }

  _rebuildTransformFolder(entity) {
    if (this._transformFolder) {
      this._transformFolder.destroy();
      this._transformFolder = null;
    }

    this._transformFolder = this._activeFolder.addFolder("Transform");
    if (!entity) {
      this._transformFolder.add({ info: "No active object" }, "info").name("Info");
      this._transformFolder.open();
      return;
    }

    const t = entity.transform;

    const fPos = this._transformFolder.addFolder("Position");
    fPos.add(t.position, "x", -10, 10, 0.01).name("x");
    fPos.add(t.position, "y", -10, 10, 0.01).name("y");
    fPos.add(t.position, "z", -10, 10, 0.01).name("z");

    const fRot = this._transformFolder.addFolder("Rotation (rad)");
    fRot.add(t.rotation, "x", -Math.PI, Math.PI, 0.01).name("x");
    fRot.add(t.rotation, "y", -Math.PI, Math.PI, 0.01).name("y");
    fRot.add(t.rotation, "z", -Math.PI, Math.PI, 0.01).name("z");

    const fScale = this._transformFolder.addFolder("Scale");
    fScale.add(t.scale, "x", 0.01, 5, 0.01).name("x");
    fScale.add(t.scale, "y", 0.01, 5, 0.01).name("y");
    fScale.add(t.scale, "z", 0.01, 5, 0.01).name("z");

    this._transformFolder.open();
  }

  _buildEntityOptions() {
    const opts = {};
    const list = this.getEntities ? this.getEntities() : [];
    for (const e of list) opts[e.name] = e.id;
    if (Object.keys(opts).length === 0) opts["<none>"] = "";
    return opts;
  }

  _pickDefaultActiveId(opts) {
    const values = Object.values(opts);
    return values.length ? values[0] : "";
  }

  // ✅ MUST be inside the class
  updateTextureName() {
    if (this._textureNameCtrl) this._textureNameCtrl.updateDisplay();
  }
}