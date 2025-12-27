import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";
import { PrimitiveFactory } from "./geometry/PrimitiveFactory.js";

async function loadText(url) {
  const res = await fetch(url);
  return await res.text();
}

const canvas = document.getElementById("glCanvas");
const gl = createGLContext(canvas);

const renderer = new Renderer(gl);
const time = new Time();

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  renderer.resize(canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// shaders
const vs = await loadText("./src/shaders/unlit.vert.glsl");
const fs = await loadText("./src/shaders/unlit.frag.glsl");
const program = new ShaderProgram(gl, vs, fs);

// cube
const cubeData = PrimitiveFactory.createCube();
const cube = new Mesh(gl, cubeData);

function renderLoop() {
  time.update();

  renderer.beginFrame();
  program.use();
  cube.draw();
  renderer.endFrame();

  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);
