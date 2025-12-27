import { createGLContext } from "./core/GLContext.js";
import { Renderer } from "./core/Renderer.js";
import { Time } from "./core/Time.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mesh } from "./core/Mesh.js";

async function loadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  return await res.text();
}

const canvas = document.getElementById("glCanvas");
const gl = createGLContext(canvas);

const renderer = new Renderer(gl);
const time = new Time();

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const displayWidth  = window.innerWidth;
  const displayHeight = window.innerHeight;

  // CSS size
  canvas.style.width  = displayWidth + "px";
  canvas.style.height = displayHeight + "px";

  // actual framebuffer size
  canvas.width  = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);

  renderer.resize(canvas.width, canvas.height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---- load shaders ----
const vsSource = await loadText("./src/shaders/unlit.vert.glsl");
const fsSource = await loadText("./src/shaders/unlit.frag.glsl");
const unlitProgram = new ShaderProgram(gl, vsSource, fsSource);

// ---- create a triangle mesh ----
const tri = new Mesh(gl, {
  positions: [
     0.0,  0.6, 0.0,
    -0.6, -0.6, 0.0,
     0.6, -0.6, 0.0
  ],
  colors: [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
  ]
});

function renderLoop() {
  time.update();

  renderer.beginFrame();

  unlitProgram.use();
  tri.draw();

  renderer.endFrame();
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
