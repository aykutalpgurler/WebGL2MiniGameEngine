import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";
import { PrimitiveFactory } from "./geometry/PrimitiveFactory.js";
import { Camera } from "./scene/Camera.js";
import { loadTexture } from "./core/TextureLoader.js";
import { loadOBJ, parseOBJ } from "./loaders/OBJLoader.js"; // parseOBJ eklendi
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

// -------------------- Cameras (Dual Viewport) --------------------
const engineCamera = new Camera(60, 1, 0.1, 100);
const gameCamera = new Camera(60, 1, 0.1, 100);

function setupInitialCameras() {
  engineCamera.position[0] = 0;
  engineCamera.position[1] = 1.2;
  engineCamera.position[2] = 3.0;
  engineCamera.target[0] = 0;
  engineCamera.target[1] = 1.0;
  engineCamera.target[2] = 0;
  engineCamera.updateView();

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

  const aspectHalf = (canvas.width * 0.5) / canvas.height;
  engineCamera.resize(aspectHalf);
  gameCamera.resize(aspectHalf);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// -------------------- Shaders --------------------
const vsSource = await loadText("./src/shaders/phong.vert.glsl");
const fsSource = await loadText("./src/shaders/phong.frag.glsl");
const program = new ShaderProgram(gl, vsSource, fsSource);

// -------------------- Texture --------------------
const albedoTex = await loadTexture(gl, "./assets/textures/pink-textured-background.jpg");

// -------------------- Meshes (Primitives + OBJ) --------------------
let meshOBJ;
try {
  const objData = await loadOBJ("./assets/models/FinalBaseMesh.obj");
  meshOBJ = new Mesh(gl, { ...objData, colors: null });
} catch (e) {
  console.warn("OBJ load failed, fallback to cube:", e.message);
  meshOBJ = new Mesh(gl, PrimitiveFactory.createCube());
}

const meshCube = new Mesh(gl, PrimitiveFactory.createCube());
const meshSphere = new Mesh(gl, PrimitiveFactory.createSphere({ latBands: 24, lonBands: 32 }));
const meshCylinder = new Mesh(gl, PrimitiveFactory.createCylinder({ radialSegments: 32 }));
const meshPrism = new Mesh(gl, PrimitiveFactory.createPrism());

// -------------------- Multi-object Scene --------------------
const entities = [];
let activeEntityId = null;

function makeId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now() + Math.random());
}

function makeEntity(mesh, name, defaultScale = 1.0) {
  const id = makeId();
  return {
    id,
    name,
    mesh,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: defaultScale, y: defaultScale, z: defaultScale }
    }
  };
}

function getActiveEntity() {
  return entities.find(e => e.id === activeEntityId) || null;
}

function meshByType(type) {
  if (type === "OBJ") return meshOBJ;
  if (type === "Cube") return meshCube;
  if (type === "Sphere") return meshSphere;
  if (type === "Cylinder") return meshCylinder;
  if (type === "Prism") return meshPrism;
  return meshOBJ;
}

function defaultScaleByType(type) {
  return type === "OBJ" ? 0.07 : 1.0;
}

function addEntityByType(type) {
  const mesh = meshByType(type);
  const ent = makeEntity(mesh, `${type}_${entities.length + 1}`, defaultScaleByType(type));
  ent.transform.position.x = (entities.length % 5) * 0.8;
  ent.transform.position.z = Math.floor(entities.length / 5) * 0.8;

  entities.push(ent);
  activeEntityId = ent.id;

  gui.refreshEntities();
  gui.setActiveEntity(ent);
}

function removeActiveEntity() {
  const idx = entities.findIndex(e => e.id === activeEntityId);
  if (idx === -1) return;
  entities.splice(idx, 1);
  activeEntityId = entities.length ? entities[entities.length - 1].id : null;
  gui.refreshEntities();
  gui.setActiveEntity(getActiveEntity());
}

// -------------------- Global State --------------------
const state = {
  useTexture: true,
  useBlinnPhong: true,
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

// -------------------- GUI --------------------
const gui = new GUIController();
gui.init({
  state,
  getEntities: () => entities,
  getActiveEntity: () => getActiveEntity(),
  onSelectActive: (id) => {
    activeEntityId = id;
    gui.setActiveEntity(getActiveEntity());
  },
  onAddEntity: (type) => addEntityByType(type),
  onRemoveActive: () => removeActiveEntity(),
  onUploadOBJ: async (file) => {
    try {
      const text = await file.text();
      const objData = parseOBJ(text);
      const newMesh = new Mesh(gl, { ...objData, colors: null });
      const ent = makeEntity(newMesh, file.name.split('.')[0], 1.0);
      entities.push(ent);
      activeEntityId = ent.id;
      gui.refreshEntities();
      gui.setActiveEntity(ent);
    } catch (e) {
      console.error("OBJ upload failed:", e);
      alert("Error loading OBJ file.");
    }
  }
});

addEntityByType("OBJ");

// -------------------- Controllers & Rendering --------------------
const fpController = new FirstPersonController(engineCamera, canvas);
fpController.attach();
const tpController = new ThirdPersonController(gameCamera, canvas);
tpController.attach();

const modelMatrix = mat4.create();

function setCommonUniforms(cam) {
  program.use();
  gl.uniformMatrix4fv(program.getUniformLocation("uView"), false, cam.viewMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uProjection"), false, cam.projectionMatrix);
  gl.uniform3fv(program.getUniformLocation("uCameraPos"), cam.position);

  gl.uniform3fv(program.getUniformLocation("uKa"), new Float32Array([state.material.ka.x, state.material.ka.y, state.material.ka.z]));
  gl.uniform3fv(program.getUniformLocation("uKd"), new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform3fv(program.getUniformLocation("uKs"), new Float32Array([state.material.ks.x, state.material.ks.y, state.material.ks.z]));
  gl.uniform1f(program.getUniformLocation("uShininess"), state.material.shininess);
  gl.uniform1i(program.getUniformLocation("uUseBlinnPhong"), state.useBlinnPhong ? 1 : 0);

  gl.uniform3fv(program.getUniformLocation("uDirLight.direction"), new Float32Array([state.dirLight.direction.x, state.dirLight.direction.y, state.dirLight.direction.z]));
  gl.uniform3fv(program.getUniformLocation("uDirLight.color"), new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform1f(program.getUniformLocation("uDirLight.intensity"), state.dirLight.intensity);

  gl.uniform3fv(program.getUniformLocation("uPointLight.position"), new Float32Array([state.pointLight.position.x, state.pointLight.position.y, state.pointLight.position.z]));
  gl.uniform3fv(program.getUniformLocation("uPointLight.color"), new Float32Array([1.0, 0.95, 0.9]));
  gl.uniform1f(program.getUniformLocation("uPointLight.intensity"), state.pointLight.intensity);
  gl.uniform1f(program.getUniformLocation("uPointLight.constant"), state.pointLight.constant);
  gl.uniform1f(program.getUniformLocation("uPointLight.linear"), state.pointLight.linear);
  gl.uniform1f(program.getUniformLocation("uPointLight.quadratic"), state.pointLight.quadratic);

  albedoTex.bind(0);
  gl.uniform1i(program.getUniformLocation("uAlbedoMap"), 0);
  gl.uniform1i(program.getUniformLocation("uUseTexture"), state.useTexture ? 1 : 0);
}

function drawEntities(cam) {
  setCommonUniforms(cam);
  for (const ent of entities) {
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [ent.transform.position.x, ent.transform.position.y, ent.transform.position.z]);
    mat4.rotateX(modelMatrix, modelMatrix, ent.transform.rotation.x);
    mat4.rotateY(modelMatrix, modelMatrix, ent.transform.rotation.y);
    mat4.rotateZ(modelMatrix, modelMatrix, ent.transform.rotation.z);
    mat4.scale(modelMatrix, modelMatrix, [ent.transform.scale.x, ent.transform.scale.y, ent.transform.scale.z]);
    gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, modelMatrix);
    ent.mesh.draw();
  }
}

function renderLoop() {
  time.update();
  fpController.update(time.deltaTime);
  tpController.update(time.deltaTime);
  const active = getActiveEntity();
  if (active) tpController.setTarget(active.transform.position.x, active.transform.position.y, active.transform.position.z);

  gl.enable(gl.SCISSOR_TEST);
  const W = canvas.width, H = canvas.height, halfW = Math.floor(W / 2);

  gl.viewport(0, 0, halfW, H);
  gl.scissor(0, 0, halfW, H);
  gl.clearColor(0.08, 0.08, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawEntities(engineCamera);

  gl.viewport(halfW, 0, W - halfW, H);
  gl.scissor(halfW, 0, W - halfW, H);
  gl.clearColor(0.05, 0.05, 0.06, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawEntities(gameCamera);

  gl.disable(gl.SCISSOR_TEST);
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);