// src/scene/controllers/ThirdPersonController.js
// Orbit (third-person) camera controller: drag to rotate, wheel to zoom, optional pan.
export class ThirdPersonController {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    // Orbit state
    this.target = window.vec3.fromValues(
      camera.target[0], camera.target[1], camera.target[2]
    );

    this.distance = 5.0;
    this.minDistance = 0.8;
    this.maxDistance = 50.0;

    this.yaw = 0.0;   // radians
    this.pitch = 0.35; // radians
    this.pitchLimit = Math.PI / 2 - 0.01;

    // Speeds
    this.rotateSpeed = 0.005;  // rad / pixel
    this.zoomSpeed = 0.0015;   // scale factor
    this.panSpeed = 0.002;     // world units / pixel (scaled by distance)

    // Input state
    this.isDragging = false;
    this.dragButton = 0; // 0:left
    this.lastX = 0;
    this.lastY = 0;

    // binds
    this._onMouseDown = (e) => this._handleMouseDown(e);
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onMouseUp = () => this._handleMouseUp();
    this._onWheel = (e) => this._handleWheel(e);
    this._onContextMenu = (e) => e.preventDefault();

    // init from current camera
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

  setTarget(x, y, z) {
    const v = window.vec3;
    v.set(this.target, x, y, z);
    this._apply();
  }

  setTargetVec3(vec3) {
    const v = window.vec3;
    v.copy(this.target, vec3);
    this._apply();
  }

  _isOnGUI(e) {
    return !!e.target.closest(".lil-gui") || !!e.target.closest(".dg");
  }

  _handleMouseDown(e) {
    if (!this.enabled) return;
    if (this._isOnGUI(e)) return;

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

    // Left drag: rotate
    if (this.dragButton === 0) {
      this.yaw -= dx * this.rotateSpeed;
      this.pitch -= dy * this.rotateSpeed;

      this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
      this._apply();
      return;
    }

    // Right drag (or middle): pan
    // (you can swap to Shift+Left if you want)
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

    e.preventDefault();

    // zoom by scaling distance
    const scale = Math.exp(e.deltaY * this.zoomSpeed);
    this.distance *= scale;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));

    this._apply();
  }

  _pan(dx, dy) {
    const v = window.vec3;

    // camera basis
    const forward = v.create();
    v.sub(forward, this.camera.target, this.camera.position);
    v.normalize(forward, forward);

    const up = v.fromValues(0, 1, 0);
    const right = v.create();
    v.cross(right, forward, up);
    v.normalize(right, right);

    // scale pan by distance so it feels consistent
    const panScale = this.panSpeed * this.distance;

    // move target opposite to screen movement
    v.scaleAndAdd(this.target, this.target, right, -dx * panScale);
    v.scaleAndAdd(this.target, this.target, up, dy * panScale);
  }

  _syncFromCamera() {
    const v = window.vec3;

    // distance
    const diff = v.create();
    v.sub(diff, this.camera.position, this.camera.target);
    this.distance = v.length(diff) || this.distance;

    // direction (from target to camera)
    v.normalize(diff, diff);

    // derive yaw/pitch: using forward = -Z convention
    // cameraPos = target + [sy*cp, sp, -cy*cp] * distance  (same as our apply)
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

    // orbit offset (same convention used in your FPS controller)
    const ox = sy * cp;
    const oy = sp;
    const oz = -cy * cp;

    // camera.position = target + offset * distance
    this.camera.position[0] = this.target[0] + ox * this.distance;
    this.camera.position[1] = this.target[1] + oy * this.distance;
    this.camera.position[2] = this.target[2] + oz * this.distance;

    // camera.target = target
    v.copy(this.camera.target, this.target);

    this.camera.updateView();
  }

  // For consistency with main loop calls
  update(_dt) {
    // no per-frame integration needed (event-driven)
    // but keep method for symmetry with FirstPersonController
  }
}
