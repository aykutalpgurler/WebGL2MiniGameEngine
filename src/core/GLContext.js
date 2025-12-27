export function createGLContext(canvas) {
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("WebGL2 not supported");
    throw new Error("WebGL2 not supported");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  return gl;
}
