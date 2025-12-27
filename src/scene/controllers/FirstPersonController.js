// src/scene/controllers/FirstPersonController.js
// WASD + mouse look using Pointer Lock
export class FirstPersonController {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    this.moveSpeed = 2.5;       // units/sec
    this.lookSpeed = 0.002;     // radians/pixel
    this.sprintMultiplier = 2.0;

    this.yaw = 0;   // around Y axis
    this.pitch = 0; // around X axis
    this.pitchLimit = Math.PI / 2 - 0.01;

    this.keys = new Set();
    this.isPointerLocked = false;

    // bind
    this._onKeyDown = (e) => this.keys.add(e.code);
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onPointerLockChange = () => this._handlePointerLockChange();
    this._onClick = () => this._requestPointerLock();

    // init from camera direction (optional)
    this._syncAnglesFromCamera();
  }

  attach() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
    this.domElement.addEventListener("click", this._onClick);
  }

  detach() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    this.domElement.removeEventListener("click", this._onClick);
  }

  _requestPointerLock() {
    if (!this.enabled) return;
    if (this.domElement.requestPointerLock) this.domElement.requestPointerLock();
  }

  _handlePointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);
  }

  _handleMouseMove(e) {
    if (!this.enabled || !this.isPointerLocked) return;

    this.yaw -= e.movementX * this.lookSpeed;
    this.pitch -= e.movementY * this.lookSpeed;

    this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
    this._applyAnglesToCamera();
  }

  _applyAnglesToCamera() {
    // forward direction from yaw/pitch
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);

    const fx = sy * cp;
    const fy = sp;
    const fz = cy * cp;

    // camera.target = camera.position + forward
    const v = window.vec3;
    v.set(this.camera.target, this.camera.position[0] + fx, this.camera.position[1] + fy, this.camera.position[2] + fz);

    this.camera.updateView();
  }

  _syncAnglesFromCamera() {
    // If you want, can derive yaw/pitch from (target-position)
    const v = window.vec3;
    const dir = v.create();
    v.sub(dir, this.camera.target, this.camera.position);
    v.normalize(dir, dir);

    this.pitch = Math.asin(dir[1]);
    this.yaw = Math.atan2(dir[0], dir[2]);
  }

  update(dt) {
    if (!this.enabled) return;

    const v = window.vec3;

    // forward (projected on XZ plane for movement)
    const forward = v.create();
    v.sub(forward, this.camera.target, this.camera.position);
    v.normalize(forward, forward);

    const forwardXZ = v.fromValues(forward[0], 0, forward[2]);
    const fLen = Math.hypot(forwardXZ[0], forwardXZ[2]) || 1.0;
    forwardXZ[0] /= fLen; forwardXZ[2] /= fLen;

    // right = normalize(cross(forwardXZ, up))
    const up = v.fromValues(0, 1, 0);
    const right = v.create();
    v.cross(right, forwardXZ, up);
    v.normalize(right, right);

    let speed = this.moveSpeed;
    if (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) speed *= this.sprintMultiplier;

    const move = v.create();

    if (this.keys.has("KeyW")) v.add(move, move, forwardXZ);
    if (this.keys.has("KeyS")) v.sub(move, move, forwardXZ);
    if (this.keys.has("KeyD")) v.add(move, move, right);
    if (this.keys.has("KeyA")) v.sub(move, move, right);

    // vertical (optional)
    if (this.keys.has("KeyE")) move[1] += 1;
    if (this.keys.has("KeyQ")) move[1] -= 1;

    const len = Math.hypot(move[0], move[1], move[2]);
    if (len > 0.00001) {
      move[0] /= len; move[1] /= len; move[2] /= len;

      const delta = speed * dt;
      this.camera.position[0] += move[0] * delta;
      this.camera.position[1] += move[1] * delta;
      this.camera.position[2] += move[2] * delta;

      // keep target in sync with angles
      this._applyAnglesToCamera();
    }
  }
}
