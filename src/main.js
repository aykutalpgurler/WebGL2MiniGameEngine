// src/main.js
import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";
import { PrimitiveFactory } from "./geometry/PrimitiveFactory.js";
import { Camera } from "./scene/Camera.js";
import { loadTexture } from "./core/TextureLoader.js";
import { loadOBJ, parseOBJ } from "./loaders/OBJLoader.js";
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
  console.log(
    "OBJ loaded:",
    objData.positions.length / 3,
    "verts,",
    objData.indices.length / 3,
    "tris"
  );
} catch (e) {
  console.warn("OBJ load failed, fallback OBJ->cube:", e.message);
  meshOBJ = new Mesh(gl, PrimitiveFactory.createCube());
}

const meshCube = new Mesh(gl, PrimitiveFactory.createCube());
const meshSphere = new Mesh(gl, PrimitiveFactory.createSphere({ latBands: 24, lonBands: 32 }));
const meshCylinder = new Mesh(gl, PrimitiveFactory.createCylinder({ radialSegments: 32 }));
const meshPrism = new Mesh(gl, PrimitiveFactory.createPrism());

const MESH_TYPES = ["OBJ", "Cube", "Sphere", "Cylinder", "Prism"];

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

// -------------------- Multi-object Scene --------------------
const entities = [];
let activeEntityId = null;

function makeId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now() + Math.random());
}

function makeEntity(meshType, mesh, name, defaultScale = 1.0) {
  const id = makeId();
  return {
    id,
    name,
    meshType,
    mesh,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: defaultScale, y: defaultScale, z: defaultScale }
    }
  };
}

function getActiveEntity() {
  return entities.find((e) => e.id === activeEntityId) || null;
}

function addEntityByType(type) {
  const mesh = meshByType(type);
  const ent = makeEntity(meshTypeSafe(type), mesh, `${type}_${entities.length + 1}`, defaultScaleByType(type));

  // küçük bir grid yerleşimi
  ent.transform.position.x = (entities.length % 5) * 0.8;
  ent.transform.position.z = Math.floor(entities.length / 5) * 0.8;

  entities.push(ent);
  activeEntityId = ent.id;

  gui.refreshEntities();
  gui.setActiveEntity(ent);
}

function meshTypeSafe(type) {
  return MESH_TYPES.includes(type) ? type : "OBJ";
}

function removeActiveEntity() {
  const idx = entities.findIndex((e) => e.id === activeEntityId);
  if (idx === -1) return;

  entities.splice(idx, 1);

  if (entities.length === 0) {
    activeEntityId = null;
    gui.refreshEntities();
    gui.setActiveEntity(null);
    return;
  }

  activeEntityId = entities[Math.min(idx, entities.length - 1)].id;
  gui.refreshEntities();
  gui.setActiveEntity(getActiveEntity());
}

function setActiveEntityMeshType(type) {
  const ent = getActiveEntity();
  if (!ent) return;

  const safe = meshTypeSafe(type);
  ent.meshType = safe;
  ent.mesh = meshByType(safe);

  // 1. implementasyondaki “OBJ ise 0.07, değilse 1” default scale davranışı
  const s = defaultScaleByType(safe);
  ent.transform.scale.x = s;
  ent.transform.scale.y = s;
  ent.transform.scale.z = s;

  gui.setActiveEntity(ent); // transform folder içeriğini güncel tutmak için
}

// -------------------- Global State (1st impl preserved) --------------------
const state = {
  // Scene-ish
  spawnType: "OBJ", // yeni obje ekleme tipi
  useTexture: true,
  useBlinnPhong: true,

  // 1st impl’deki “kendi kendine dönme” hissi korunuyor:
  autoRotateActive: true,
  rotateSpeed: 0.6, // rad/sec

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

// -------------------- GUI (merged) --------------------
const gui = new GUIController();
gui.init({
  state,
  meshTypes: MESH_TYPES,

  getEntities: () => entities,
  getActiveEntity: () => getActiveEntity(),

  onSelectActive: (id) => {
    activeEntityId = id;
    gui.setActiveEntity(getActiveEntity());
  },

  // multi-object actions
  onAddEntity: (type) => addEntityByType(type),
  onRemoveActive: () => removeActiveEntity(),
  onChangeActiveMeshType: (type) => setActiveEntityMeshType(type),

  onUploadOBJ: async (file) => {
    try {
      const text = await file.text();
      const objData = parseOBJ(text);
      const newMesh = new Mesh(gl, { ...objData, colors: null });

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const ent = makeEntity("OBJ", newMesh, baseName, 1.0);

      // upload edilenleri de biraz yan yana diz
      ent.transform.position.x = (entities.length % 5) * 0.8;
      ent.transform.position.z = Math.floor(entities.length / 5) * 0.8;

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

// 1st impl davranışını koru: başlangıçta 1 adet OBJ olsun
addEntityByType("OBJ");

// -------------------- Controllers --------------------
const fpController = new FirstPersonController(engineCamera, canvas);
fpController.attach();

const tpController = new ThirdPersonController(gameCamera, canvas);
tpController.attach();

// -------------------- Rendering --------------------
const modelMatrix = mat4.create();
let autoAngle = 0;

function setCommonUniforms(cam) {
  program.use();

  // View/Projection
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

  // Point light + attenuation (1st impl preserved)
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

function buildModelMatrixForEntity(ent, extraYaw = 0) {
  mat4.identity(modelMatrix);

  mat4.translate(modelMatrix, modelMatrix, [
    ent.transform.position.x,
    ent.transform.position.y,
    ent.transform.position.z
  ]);

  mat4.rotateX(modelMatrix, modelMatrix, ent.transform.rotation.x);
  mat4.rotateY(modelMatrix, modelMatrix, ent.transform.rotation.y + extraYaw);
  mat4.rotateZ(modelMatrix, modelMatrix, ent.transform.rotation.z);

  mat4.scale(modelMatrix, modelMatrix, [
    ent.transform.scale.x,
    ent.transform.scale.y,
    ent.transform.scale.z
  ]);
}

function drawEntities(cam) {
  setCommonUniforms(cam);

  const active = getActiveEntity();

  for (const ent of entities) {
    const extraYaw = state.autoRotateActive && active && ent.id === active.id ? autoAngle : 0;

    buildModelMatrixForEntity(ent, extraYaw);
    gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, modelMatrix);

    ent.mesh.draw();
  }
}

function renderLoop() {
  time.update();

  fpController.update(time.deltaTime);
  tpController.update(time.deltaTime);

  // 1st impl “angle” hissi (active entity’ye uygulanıyor)
  autoAngle += time.deltaTime * state.rotateSpeed;

  // Orbit target: active entity’nin pozisyonunu takip et (2nd impl preserved)
  const active = getActiveEntity();
  if (active) {
    tpController.setTarget(
      active.transform.position.x,
      active.transform.position.y,
      active.transform.position.z
    );
  }

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
  drawEntities(engineCamera);

  // RIGHT: Game View (Third Person)
  gl.viewport(halfW, 0, W - halfW, H);
  gl.scissor(halfW, 0, W - halfW, H);
  gl.clearColor(0.05, 0.05, 0.06, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawEntities(gameCamera);

  gl.disable(gl.SCISSOR_TEST);

  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);
