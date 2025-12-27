import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";
import { PrimitiveFactory } from "./geometry/PrimitiveFactory.js";
import { Camera } from "./scene/Camera.js";

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

let camera;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  renderer.resize(canvas.width, canvas.height);

  if (camera) camera.resize(canvas.width / canvas.height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---- shaders (Phong) ----
const vsSource = await loadText("./src/shaders/phong.vert.glsl");
const fsSource = await loadText("./src/shaders/phong.frag.glsl");
const program = new ShaderProgram(gl, vsSource, fsSource);

// ---- camera ----
camera = new Camera(60, canvas.width / canvas.height, 0.1, 100);

// ---- mesh (cube with normals/uvs) ----
const cubeData = PrimitiveFactory.createCube();
const cube = new Mesh(gl, cubeData);

// ---- transforms ----
const modelMatrix = mat4.create();
let angle = 0;

function renderLoop() {
  time.update();
  angle += time.deltaTime * 0.8;

  renderer.beginFrame();

  // model: rotate around Y
  mat4.identity(modelMatrix);
  mat4.rotateY(modelMatrix, modelMatrix, angle);

  program.use();

  // MVP
  gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, modelMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uView"), false, camera.viewMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uProjection"), false, camera.projectionMatrix);

  // Camera
  gl.uniform3fv(program.getUniformLocation("uCameraPos"), camera.position);

  // Material (simple white-ish)
  gl.uniform3fv(program.getUniformLocation("uKa"), new Float32Array([0.08, 0.08, 0.08]));
  gl.uniform3fv(program.getUniformLocation("uKd"), new Float32Array([0.90, 0.90, 0.90]));
  gl.uniform3fv(program.getUniformLocation("uKs"), new Float32Array([0.60, 0.60, 0.60]));
  gl.uniform1f(program.getUniformLocation("uShininess"), 64.0);
  gl.uniform1i(program.getUniformLocation("uUseBlinnPhong"), 1);

  // Directional light
  gl.uniform3fv(program.getUniformLocation("uDirLight.direction"), new Float32Array([0.3, -1.0, 0.2]));
  gl.uniform3fv(program.getUniformLocation("uDirLight.color"), new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform1f(program.getUniformLocation("uDirLight.intensity"), 0.7);

  // Point light + attenuation
  gl.uniform3fv(program.getUniformLocation("uPointLight.position"), new Float32Array([1.5, 1.5, 2.0]));
  gl.uniform3fv(program.getUniformLocation("uPointLight.color"), new Float32Array([1.0, 0.95, 0.9]));
  gl.uniform1f(program.getUniformLocation("uPointLight.intensity"), 3.0);
  gl.uniform1f(program.getUniformLocation("uPointLight.constant"), 1.0);
  gl.uniform1f(program.getUniformLocation("uPointLight.linear"), 0.22);
  gl.uniform1f(program.getUniformLocation("uPointLight.quadratic"), 0.20);

  cube.draw();

  renderer.endFrame();
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
