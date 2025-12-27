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

// gl-matrix global
const mat4 = window.mat4;


let camera;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // CSS size
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  // framebuffer size
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  renderer.resize(canvas.width, canvas.height);

  if (camera) {
    camera.resize(canvas.width / canvas.height);
  }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---- shaders ----
const vsSource = await loadText("./src/shaders/unlit.vert.glsl");
const fsSource = await loadText("./src/shaders/unlit.frag.glsl");
const program = new ShaderProgram(gl, vsSource, fsSource);

// ---- camera ----
camera = new Camera(
  60,
  canvas.width / canvas.height,
  0.1,
  100
);

// ---- cube mesh ----
const cubeData = PrimitiveFactory.createCube();
const cube = new Mesh(gl, cubeData);

// ---- model transform ----
const modelMatrix = mat4.create();
let angle = 0;

function renderLoop() {
  time.update();
  angle += time.deltaTime * 0.8; // rotation speed

  renderer.beginFrame();

  // model matrix: rotate around Y
  mat4.identity(modelMatrix);
  mat4.rotateY(modelMatrix, modelMatrix, angle);

  program.use();

  gl.uniformMatrix4fv(program.getUniformLocation("uModel"), false, modelMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uView"), false, camera.viewMatrix);
  gl.uniformMatrix4fv(program.getUniformLocation("uProjection"), false, camera.projectionMatrix);

  cube.draw();

  renderer.endFrame();
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
