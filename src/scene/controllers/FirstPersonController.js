
export class FirstPersonController {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = true;

    // Movement settings [cite: 39]
    this.moveSpeed = 2.5;       // units/sec
    this.lookSpeed = 0.002;     // radians/pixel
    this.sprintMultiplier = 2.0;

    // Rotation state
    this.yaw = 0;   // around Y axis
    this.pitch = 0; // around X axis
    this.pitchLimit = Math.PI / 2 - 0.01; // Prevent gimble lock/flipping

    this.keys = new Set();
    this.isPointerLocked = false;
    
    // CRITICAL: Prevent the "jump" on the first mouse movement after lock
    this.firstMoveAfterLock = false;

    // Binds
    this._onKeyDown = (e) => this.keys.add(e.code);
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onPointerLockChange = () => this._handlePointerLockChange();
    this._onClick = (e) => {
      // GUI etkileşimi sırasında pointer lock'ı engelle 
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
    
    // İlk açıları kameranın mevcut durumundan al [cite: 38]
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
    // lil-gui veya dat.GUI öğelerine tıklanıp tıklanmadığını kontrol eder 
    return !!e.target.closest(".lil-gui") || !!e.target.closest(".dg");
  }

  _requestPointerLock() {
    if (!this.enabled) return;
    if (this.domElement.requestPointerLock) this.domElement.requestPointerLock();
  }

  _handlePointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.domElement);

    if (this.isPointerLocked) {
      // Locklandığı anda açıları tekrar senkronize et ve jump korumasını aç
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

  // Yaw (Left/Right) - Zaten doğru olduğunu belirttiniz
  this.yaw -= e.movementX * this.lookSpeed;

  // Pitch (Up/Down) FIX:
  // Eğer fareyi yukarı ittiğinizde aşağı bakıyorsa burayı '+' yapın.
  // Eğer fareyi aşağı çektiğinizde yukarı bakıyorsa burayı '-' yapın.
  this.pitch += e.movementY * this.lookSpeed; 

  this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
  this._applyAnglesToCamera();
}

  _applyAnglesToCamera() {
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);

    // Standard FPS convention (Forward Vector calculation) [cite: 37]
    const fx =  sy * cp;
    const fy =  sp;
    const fz = -cy * cp;

    const v = window.vec3; // glMatrix instance assumed
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
    // dir = target - position
    v.sub(dir, this.camera.target, this.camera.position);
    v.normalize(dir, dir);

    // Inverse Trigonometry to prevent camera jump [cite: 38]
    this.pitch = Math.asin(dir[1]);
    this.yaw   = Math.atan2(dir[0], -dir[2]);
  }

  update(dt) {
    if (!this.enabled) return;

    const v = window.vec3;

    // Forward vector (XZ plane movement only for standard FPS) [cite: 39]
    const forward = v.create();
    v.sub(forward, this.camera.target, this.camera.position);
    
    const forwardXZ = v.fromValues(forward[0], 0, forward[2]);
    v.normalize(forwardXZ, forwardXZ);

    // Right vector = cross(forwardXZ, up)
    const up = v.fromValues(0, 1, 0);
    const right = v.create();
    v.cross(right, forwardXZ, up);
    v.normalize(right, right);

    let speed = this.moveSpeed;
    if (this.keys.has("ShiftLeft")) speed *= this.sprintMultiplier;

    const move = v.create();
    if (this.keys.has("KeyW")) v.add(move, move, forwardXZ);
    if (this.keys.has("KeyS")) v.sub(move, move, forwardXZ);
    if (this.keys.has("KeyD")) v.add(move, move, right);
    if (this.keys.has("KeyA")) v.sub(move, move, right);

    // Optional: Vertical movement [cite: 39]
    if (this.keys.has("KeyE")) move[1] += 1;
    if (this.keys.has("KeyQ")) move[1] -= 1;

    if (v.length(move) > 0) {
      v.normalize(move, move);
      const delta = speed * dt;
      v.scaleAndAdd(this.camera.position, this.camera.position, move, delta);

      // Kameranın baktığı hedef noktayı (target) hareketle birlikte güncelle
      this._applyAnglesToCamera();
    }
  }
}