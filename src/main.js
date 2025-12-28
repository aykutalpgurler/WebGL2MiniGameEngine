// src/main.js
import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";
import { PrimitiveFactory } from "./geometry/PrimitiveFactory.js";
import { Camera } from "./scene/Camera.js";
import { loadTexture } from "./core/TextureLoader.js";
import { loadOBJ } from "./loaders/OBJLoader.js";
import { FirstPersonController } from "./scene/controllers/FirstPersonController.js";
import { ThirdPersonController } from "./scene/controllers/ThirdPersonController.js";
import { GUIController } from "./ui/GUI.js";

async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  return await res.text();
}

const canvas = document.getElementById("glCanvas");
const gl = createGLContext(canvas);

const renderer = new Renderer(gl);
const time = new Time();
const mat4 = window.mat4;

// --- Two cameras for bonus dual viewport ---
const engineCamera = new Camera(60, 1, 0.1, 100);
const gameCamera = new Camera(60, 1, 0.1, 100);

function setupInitialCameras() {
  // Engine view (free roam)
  engineCamera.position[0] = 0;
  engineCamera.position[1] = 1.2;
  engineCamera.position[2] = 3.0;
  engineCamera.target[0] = 0;
  engineCamera.target[1] = 1.0;
  engineCamera.target[2] = 0;
  engineCamera.updateView();

  // Game view (orbit around target)
  gameCamera.position[0] = 2.5;
  gameCamera.position[1] = 2.0;
  gameCamera.position[2] = 4.0;
  gameCamera.target[0] = 0;
  gameCamera.target[1] = 1.0;
  gameCamera.target[2] = 0;
  gameCamera.updateView();
}

setupInitialCameras();

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  renderer.resize(canvas.width, canvas.height);

  // Each viewport is half width
  const aspectHalf = (canvas.width * 0.5) / canvas.height;
  engineCamera.resize(aspectHalf);
  gameCamera.resize(aspectHalf);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---- shaders ----
const vsSource = await loadText("./src/shaders/phong.vert.glsl");
const fsSource = await loadText("./src/shaders/phong.frag.glsl");
const program = new ShaderProgram(gl, vsSource, fsSource);

// ---- texture ----
const albedoTex = await loadTexture(gl, "./assets/textures/pink-textured-background.jpg");

// ---- mesh: OBJ + primitives ----
let meshOBJ;
try {
  const objData = await loadOBJ("./assets/models/FinalBaseMesh.obj");
  meshOBJ = new Mesh(gl, { ...objData, colors: null });
  console.log("OBJ loaded:", objData.positions.length / 3, "verts,", objData.indices.length / 3, "tris");
} catch (e) {
  console.warn("OBJ load failed, fallback OBJ->cube:", e.message);
  meshOBJ = new Mesh(gl, PrimitiveFactory.createCube());
}

const meshCube = new Mesh(gl, PrimitiveFactory.createCube());
const meshSphere = new Mesh(gl, PrimitiveFactory.createSphere({ latBands: 24, lonBands: 32 }));
const meshCylinder = new Mesh(gl, PrimitiveFactory.createCylinder({ radialSegments: 32 }));
const meshPrism = new Mesh(gl, PrimitiveFactory.createPrism());

const state = {
  meshType: "OBJ",
  useTexture: true,
  useBlinnPhong: true,

  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.07, y: 0.07, z: 0.07 }
  },

  dirLight: {
    direction: { x: 0.3, y: -1.0, z: 0.2 },
    intensity: 0.7
  },

  pointLight: {
    position: { x: 1.5, y: 1.5, z: 2.0 },
    intensity: 3.0,
    constant: 1.0,
    linear: 0.22,
    quadratic: 0.2
  },

  material: {
    ka: { x: 0.08, y: 0.08, z: 0.08 },
    ks: { x: 0.6, y: 0.6, z: 0.6 },
    shininess: 64
  }
};

function pickMesh(type) {
  if (type === "OBJ") return meshOBJ;
  if (type === "Cube") return meshCube;
  if (type === "Sphere") return meshSphere;
  if (type === "Cylinder") return meshCylinder;
  if (type === "Prism") return meshPrism;
  return meshOBJ;
}

let activeMesh = pickMesh(state.meshType);

// ---- GUI ----
const gui = new GUIController();
gui.init({
  state,
  onSelectMeshType: (v) => {
    activeMesh = pickMesh(v);

    // defaults per mesh
    if (v !== "OBJ") {
      state.transform.scale.x = 1;
      state.transform.scale.y = 1;
      state.transform.scale.z = 1;
    } else {
      state.transform.scale.x = 0.07;
      state.transform.scale.y = 0.07;
      state.transform.scale.z = 0.07;
    }
  },
  onToggleTexture: (v) => {
    state.useTexture = v;
  }
});

// ---- Controllers ----
// Engine view: first-person free roam
const fpController = new FirstPersonController(engineCamera, canvas);
fpController.attach();

// Game view: third-person orbit camera
const tpController = new ThirdPersonController(gameCamera, canvas);
tpController.attach();

// Keep orbit target on current object position
function syncOrbitTargetFromState() {
  tpController.setTarget(
    state.transform.position.x,
    state.transform.position.y,
    state.transform.position.z
  );
}

// ---- transforms ----
const modelMatrix = mat4.create();
let angle = 0;

function setCommonUniforms(cam) {
  // MVP
  gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, modelMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uView"), false, cam.viewMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uProjection"), false, cam.projectionMatrix);

  // Camera
  gl.uniform3fv(program.getUniformLocation("uCameraPos"), cam.position);

  // Material
  gl.uniform3fv(
    program.getUniformLocation("uKa"),
    new Float32Array([state.material.ka.x, state.material.ka.y, state.material.ka.z])
  );
  gl.uniform3fv(program.getUniformLocation("uKd"), new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform3fv(
    program.getUniformLocation("uKs"),
    new Float32Array([state.material.ks.x, state.material.ks.y, state.material.ks.z])
  );
  gl.uniform1f(program.getUniformLocation("uShininess"), state.material.shininess);
  gl.uniform1i(program.getUniformLocation("uUseBlinnPhong"), state.useBlinnPhong ? 1 : 0);

  // Directional light
  gl.uniform3fv(
    program.getUniformLocation("uDirLight.direction"),
    new Float32Array([state.dirLight.direction.x, state.dirLight.direction.y, state.dirLight.direction.z])
  );
  gl.uniform3fv(program.getUniformLocation("uDirLight.color"), new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform1f(program.getUniformLocation("uDirLight.intensity"), state.dirLight.intensity);

  // Point light + attenuation
  gl.uniform3fv(
    program.getUniformLocation("uPointLight.position"),
    new Float32Array([state.pointLight.position.x, state.pointLight.position.y, state.pointLight.position.z])
  );
  gl.uniform3fv(program.getUniformLocation("uPointLight.color"), new Float32Array([1.0, 0.95, 0.9]));
  gl.uniform1f(program.getUniformLocation("uPointLight.intensity"), state.pointLight.intensity);
  gl.uniform1f(program.getUniformLocation("uPointLight.constant"), state.pointLight.constant);
  gl.uniform1f(program.getUniformLocation("uPointLight.linear"), state.pointLight.linear);
  gl.uniform1f(program.getUniformLocation("uPointLight.quadratic"), state.pointLight.quadratic);

  // Texture
  albedoTex.bind(0);
  gl.uniform1i(program.getUniformLocation("uAlbedoMap"), 0);
  gl.uniform1i(program.getUniformLocation("uUseTexture"), state.useTexture ? 1 : 0);
}

function drawScene(cam) {
  program.use();
  setCommonUniforms(cam);
  activeMesh.draw();
}

function renderLoop() {
  time.update();

  fpController.update(time.deltaTime);
  tpController.update(time.deltaTime);

  angle += time.deltaTime * 0.6;

  // Keep orbit target synced to object position
  // syncOrbitTargetFromState();

  // Build model matrix from GUI transform
  mat4.identity(modelMatrix);

  mat4.translate(modelMatrix, modelMatrix, [
    state.transform.position.x,
    state.transform.position.y,
    state.transform.position.z
  ]);

  mat4.rotateX(modelMatrix, modelMatrix, state.transform.rotation.x);
  mat4.rotateY(modelMatrix, modelMatrix, state.transform.rotation.y + angle);
  mat4.rotateZ(modelMatrix, modelMatrix, state.transform.rotation.z);

  mat4.scale(modelMatrix, modelMatrix, [
    state.transform.scale.x,
    state.transform.scale.y,
    state.transform.scale.z
  ]);

  // --- Dual viewport rendering (scissor + viewport) ---
  gl.enable(gl.SCISSOR_TEST);

  const W = canvas.width;
  const H = canvas.height;
  const halfW = Math.floor(W / 2);

  // LEFT: Engine View (First Person)
  gl.viewport(0, 0, halfW, H);
  gl.scissor(0, 0, halfW, H);
  gl.clearColor(0.08, 0.08, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawScene(engineCamera);

  // RIGHT: Game View (Third Person)
  gl.viewport(halfW, 0, W - halfW, H);
  gl.scissor(halfW, 0, W - halfW, H);
  gl.clearColor(0.05, 0.05, 0.06, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawScene(gameCamera);

  gl.disable(gl.SCISSOR_TEST);

  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
