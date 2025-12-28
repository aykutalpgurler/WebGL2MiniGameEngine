// src/scene/controllers/ThirdPersonController.js
// Orbit (third-person) camera controller: drag to rotate, wheel to zoom, optional pan.
// Input is active ONLY on the right half of the canvas (for dual viewport demo).
export class ThirdPersonController {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    const v = window.vec3;

    // Orbit target
    this.target = v.fromValues(camera.target[0], camera.target[1], camera.target[2]);

    // Orbit params
    this.distance = 5.0;
    this.minDistance = 0.8;
    this.maxDistance = 50.0;

    this.yaw = 0.0;
    this.pitch = 0.35;
    this.pitchLimit = Math.PI / 2 - 0.01;

    // Speeds
    this.rotateSpeed = 0.005;   // rad / pixel
    this.zoomSpeed = 0.0015;    // exp scale
    this.panSpeed = 0.002;      // world units / pixel (scaled by distance)

    // Input state
    this.isDragging = false;
    this.dragButton = 0;
    this.lastX = 0;
    this.lastY = 0;

    // Binds
    this._onMouseDown = (e) => this._handleMouseDown(e);
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onMouseUp = () => this._handleMouseUp();
    this._onWheel = (e) => this._handleWheel(e);
    this._onContextMenu = (e) => e.preventDefault();

    // Init from current camera pose
    this._syncFromCamera();
    this._apply();
  }

  attach() {
    this.domElement.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
    this.domElement.addEventListener("wheel", this._onWheel, { passive: false });
    this.domElement.addEventListener("contextmenu", this._onContextMenu);
  }

  detach() {
    this.domElement.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    this.domElement.removeEventListener("wheel", this._onWheel);
    this.domElement.removeEventListener("contextmenu", this._onContextMenu);
  }

  // --- public API ---
  setTarget(x, y, z) {
    // IMPORTANT: do NOT reset yaw/pitch here.
    // This prevents "orbit snapping" when main.js updates object position frequently.
    const v = window.vec3;
    v.set(this.target, x, y, z);
    this._apply();
  }

  setTargetVec3(vec3) {
    const v = window.vec3;
    v.copy(this.target, vec3);
    this._apply();
  }

  // --- helpers ---
  _isOnGUI(e) {
    return !!e.target.closest(".lil-gui") || !!e.target.closest(".dg");
  }

  _isInRightViewport(e) {
    // enable input only on right half of the canvas
    const rect = this.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return x >= rect.width / 2;
  }

  _handleMouseDown(e) {
    if (!this.enabled) return;
    if (this._isOnGUI(e)) return;
    if (!this._isInRightViewport(e)) return;

    this.isDragging = true;
    this.dragButton = e.button;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  _handleMouseMove(e) {
    if (!this.enabled || !this.isDragging) return;

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Left drag: orbit rotate
    if (this.dragButton === 0) {
      this.yaw -= dx * this.rotateSpeed;
      this.pitch -= dy * this.rotateSpeed;

      this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
      this._apply();
      return;
    }

    // Right/Middle drag: pan
    if (this.dragButton === 2 || this.dragButton === 1) {
      this._pan(dx, dy);
      this._apply();
    }
  }

  _handleMouseUp() {
    this.isDragging = false;
  }

  _handleWheel(e) {
    if (!this.enabled) return;
    if (this._isOnGUI(e)) return;
    if (!this._isInRightViewport(e)) return;

    e.preventDefault();

    // zoom by scaling distance
    const scale = Math.exp(e.deltaY * this.zoomSpeed);
    this.distance *= scale;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));

    this._apply();
  }

  _pan(dx, dy) {
    const v = window.vec3;

    const forward = v.create();
    v.sub(forward, this.camera.target, this.camera.position);
    v.normalize(forward, forward);

    const up = v.fromValues(0, 1, 0);
    const right = v.create();
    v.cross(right, forward, up);
    v.normalize(right, right);

    const panScale = this.panSpeed * this.distance;

    v.scaleAndAdd(this.target, this.target, right, -dx * panScale);
    v.scaleAndAdd(this.target, this.target, up, dy * panScale);
  }

  _syncFromCamera() {
    const v = window.vec3;

    // distance = |pos - target|
    const diff = v.create();
    v.sub(diff, this.camera.position, this.camera.target);
    this.distance = v.length(diff) || this.distance;

    // direction from target to camera
    v.normalize(diff, diff);

    // convention used by apply(): offset = [sy*cp, sp, -cy*cp]
    this.pitch = Math.asin(diff[1]);
    this.yaw = Math.atan2(diff[0], -diff[2]);

    this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
  }

  _apply() {
    const v = window.vec3;

    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);

    // orbit offset (forward = -Z convention)
    const ox = sy * cp;
    const oy = sp;
    const oz = -cy * cp;

    // position = target + offset * distance
    this.camera.position[0] = this.target[0] + ox * this.distance;
    this.camera.position[1] = this.target[1] + oy * this.distance;
    this.camera.position[2] = this.target[2] + oz * this.distance;

    // look at target
    v.copy(this.camera.target, this.target);

    this.camera.updateView();
  }

  update(_dt) {
    // event-driven; kept for symmetry
  }
}
