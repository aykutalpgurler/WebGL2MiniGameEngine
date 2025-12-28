// src/ui/GUI.js
export class GUIController {
  constructor() {
    this.gui = null;
    this.state = null;
    this.getEntities = null;
    this.getActiveEntity = null;

    this.onSelectActive = null;
    this.onAddEntity = null;
    this.onRemoveActive = null;
    this.onUploadOBJ = null; // Yeni callback

    this._activeEntity = null;
    this._activeDropdown = null;
    this._activeProxy = { active: "" };
    this._transformFolder = null;
  }

  init({ state, getEntities, getActiveEntity, onSelectActive, onAddEntity, onRemoveActive, onUploadOBJ }) {
    this.state = state;
    this.getEntities = getEntities;
    this.getActiveEntity = getActiveEntity;
    this.onSelectActive = onSelectActive;
    this.onAddEntity = onAddEntity;
    this.onRemoveActive = onRemoveActive;
    this.onUploadOBJ = onUploadOBJ;

    const LilGUI = window.lil?.GUI;
    if (!LilGUI) {
      console.warn("lil-gui not found on window.lil.GUI");
      return;
    }

    this.gui = new LilGUI({ title: "BBM414 Engine" });

    // --- Scene / Objects ---
    const sceneFolder = this.gui.addFolder("Scene");

    // Dynamic OBJ Upload
    sceneFolder.add({ upload: () => this._triggerFileInput() }, "upload").name("📁 Upload OBJ");
    
    sceneFolder.add({ addCube: () => this.onAddEntity("Cube") }, "addCube").name("Add Cube");
    sceneFolder.add({ addSphere: () => this.onAddEntity("Sphere") }, "addSphere").name("Add Sphere");
    sceneFolder.add({ addCylinder: () => this.onAddEntity("Cylinder") }, "addCylinder").name("Add Cylinder");
    sceneFolder.add({ addPrism: () => this.onAddEntity("Prism") }, "addPrism").name("Add Prism");
    sceneFolder.add({ remove: () => this.onRemoveActive() }, "remove").name("Remove Active");

    const opts = this._buildEntityOptions();
    this._activeProxy.active = this._pickDefaultActiveId(opts);

    this._activeDropdown = sceneFolder
      .add(this._activeProxy, "active", opts)
      .name("Active Object")
      .onChange((id) => {
        if (this.onSelectActive) this.onSelectActive(id);
      });

    sceneFolder.open();

    // --- Render / Material / Lights (Statik Klasörler) ---
    this._setupStaticFolders();

    // Initial Active Entity
    this.setActiveEntity(this.getActiveEntity());
  }

  _triggerFileInput() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".obj";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file && this.onUploadOBJ) {
        this.onUploadOBJ(file);
      }
    };
    fileInput.click();
  }

  refreshEntities() {
    if (!this._activeDropdown) return;
    const opts = this._buildEntityOptions();
    this._activeDropdown.options(opts);

    const active = this.getActiveEntity ? this.getActiveEntity() : null;
    if (active) {
      this._activeDropdown.setValue(active.id);
    }
  }

  setActiveEntity(entity) {
    this._activeEntity = entity;
    this._rebuildTransformFolder(entity);
    if (this._activeDropdown && entity) {
      this._activeDropdown.setValue(entity.id);
    }
  }

  _rebuildTransformFolder(entity) {
    if (!this.gui) return;

    // FIX: lil-gui uses .destroy() instead of removeFolder()
    if (this._transformFolder) {
      this._transformFolder.destroy();
      this._transformFolder = null;
    }

    this._transformFolder = this.gui.addFolder("Active Object Transform");

    if (!entity) {
      this._transformFolder.add({ info: "No active object" }, "info").name("Info");
      return;
    }

    const t = entity.transform;
    const pos = this._transformFolder.addFolder("Position");
    pos.add(t.position, "x", -20, 20).name("X");
    pos.add(t.position, "y", -20, 20).name("Y");
    pos.add(t.position, "z", -20, 20).name("Z");
    
    const rot = this._transformFolder.addFolder("Rotation (rad)");
    rot.add(t.rotation, "x", -Math.PI, Math.PI).name("X");
    rot.add(t.rotation, "y", -Math.PI, Math.PI).name("Y");
    rot.add(t.rotation, "z", -Math.PI, Math.PI).name("Z");

    const sca = this._transformFolder.addFolder("Scale");
    sca.add(t.scale, "x", 0.01, 10).name("X");
    sca.add(t.scale, "y", 0.01, 10).name("Y");
    sca.add(t.scale, "z", 0.01, 10).name("Z");

    this._transformFolder.open();
  }

  _setupStaticFolders() {
    const renderFolder = this.gui.addFolder("Render Settings");
    renderFolder.add(this.state, "useTexture").name("Use Texture");
    renderFolder.add(this.state, "useBlinnPhong").name("Blinn-Phong");

    const matFolder = this.gui.addFolder("Material Properties");
    matFolder.add(this.state.material, "shininess", 1, 256).name("Shininess");
    matFolder.addColor(this.state.material, "ka").name("Ambient (Ka)");
    matFolder.addColor(this.state.material, "ks").name("Specular (Ks)");
  }

  _buildEntityOptions() {
    const opts = {};
    const list = this.getEntities ? this.getEntities() : [];
    for (const e of list) opts[e.name] = e.id;
    if (Object.keys(opts).length === 0) opts["<none>"] = "";
    return opts;
  }

  _pickDefaultActiveId(opts) {
    const ids = Object.values(opts);
    return ids.length ? ids[0] : "";
  }
}