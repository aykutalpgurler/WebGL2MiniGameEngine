import { Texture2D } from "./Texture2D.js";

export async function loadTexture(gl, url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return new Texture2D(gl, img);
}
