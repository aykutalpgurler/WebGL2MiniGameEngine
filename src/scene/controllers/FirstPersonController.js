// src/scene/controllers/FirstPersonController.js
// WASD + mouse look using Pointer Lock (with GUI click-safe + no-jump on lock)
export class FirstPersonController {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    // Movement settings
    this.moveSpeed = 2.5;       // units/sec
    this.lookSpeed = 0.002;     // radians/pixel
    this.sprintMultiplier = 2.0;

    // Rotation state
    this.yaw = 0;   // around Y axis
    this.pitch = 0; // around X axis
    this.pitchLimit = Math.PI / 2 - 0.01;

    this.keys = new Set();
    this.isPointerLocked = false;

    // Prevent "jump" after lock
    this.firstMoveAfterLock = false;

    // Binds
    this._onKeyDown = (e) => this.keys.add(e.code);
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onPointerLockChange = () => this._handlePointerLockChange();
    this._onClick = (e) => {
      if (this._isClickOnGUI(e)) return;
      this._requestPointerLock();
    };
  }

  attach() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
    this.domElement.addEventListener("click", this._onClick);

    // Sync angles once camera is ready
    this._syncAnglesFromCamera();
  }

  detach() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    this.domElement.removeEventListener("click", this._onClick);
  }

  _isClickOnGUI(e) {
    return !!e.target.closest(".lil-gui") || !!e.target.closest(".dg");
  }

  _requestPointerLock() {
    if (!this.enabled) return;
    if (this.domElement.requestPointerLock) this.domElement.requestPointerLock();
  }

  _handlePointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);

    if (this.isPointerLocked) {
      this._syncAnglesFromCamera();
      this.firstMoveAfterLock = true;
    } else {
      this.keys.clear();
    }
  }

  _handleMouseMove(e) {
    if (!this.enabled || !this.isPointerLocked) return;

    if (this.firstMoveAfterLock) {
      this.firstMoveAfterLock = false;
      return;
    }

    // Right/Left correct
    this.yaw -= e.movementX * this.lookSpeed;

    // Up/Down correct (as you confirmed)
    this.pitch += e.movementY * this.lookSpeed;

    this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
    this._applyAnglesToCamera();
  }

  _applyAnglesToCamera() {
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);

    // Standard FPS convention (forward = -Z)
    const fx = sy * cp;
    const fy = sp;
    const fz = -cy * cp;

    const v = window.vec3;
    v.set(
      this.camera.target,
      this.camera.position[0] + fx,
      this.camera.position[1] + fy,
      this.camera.position[2] + fz
    );

    this.camera.updateView();
  }

  _syncAnglesFromCamera() {
    const v = window.vec3;
    const dir = v.create();
    v.sub(dir, this.camera.target, this.camera.position);
    v.normalize(dir, dir);

    this.pitch = Math.asin(dir[1]);
    // match forward = -Z convention
    this.yaw = Math.atan2(dir[0], -dir[2]);
  }

  update(dt) {
    if (!this.enabled) return;

    const v = window.vec3;

    // forward (XZ movement)
    const forward = v.create();
    v.sub(forward, this.camera.target, this.camera.position);

    const forwardXZ = v.fromValues(forward[0], 0, forward[2]);
    v.normalize(forwardXZ, forwardXZ);

    // right = cross(forwardXZ, up)
    // right = normalize(cross(up, forwardXZ))
const up = v.fromValues(0, 1, 0);
const right = v.create();
v.cross(right, up, forwardXZ);   // ✅ FIXED
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

    if (v.length(move) > 0) {
      v.normalize(move, move);

      const delta = speed * dt;
      v.scaleAndAdd(this.camera.position, this.camera.position, move, delta);

      // keep target consistent
      this._applyAnglesToCamera();
    }
  }
}
