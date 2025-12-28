// Lightweight overlay for quick scene stats (fps, entity count, camera pose).
export class Inspector {
  constructor() {
    this.root = document.createElement("div");
    this.root.style.position = "fixed";
    this.root.style.left = "12px";
    this.root.style.bottom = "12px";
    this.root.style.padding = "10px 12px";
    this.root.style.background = "rgba(0, 0, 0, 0.55)";
    this.root.style.color = "#eaeaea";
    this.root.style.font = "12px/1.4 'Fira Code', monospace";
    this.root.style.pointerEvents = "none";
    this.root.style.backdropFilter = "blur(4px)";
    this.root.style.border = "1px solid rgba(255,255,255,0.08)";
    this.root.style.borderRadius = "8px";
    this.root.style.whiteSpace = "pre";

    this.text = document.createElement("div");
    this.root.appendChild(this.text);

    this.visible = false;
  }

  attach(parent = document.body) {
    parent.appendChild(this.root);
    this.visible = true;
  }

  detach() {
    this.root.remove();
    this.visible = false;
  }

  setSceneInfo({
    fps = null,
    entityCount = null,
    activeName = "",
    cameraPos = null
  } = {}) {
    if (!this.visible) return;

    const lines = [];

    if (fps != null) lines.push(`fps: ${fps.toFixed(1)}`);
    if (entityCount != null) lines.push(`entities: ${entityCount}`);
    if (activeName) lines.push(`active: ${activeName}`);
    if (cameraPos) {
      lines.push(
        `camera: ${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}`
      );
    }

    this.text.textContent = lines.join("\n");
  }
}
