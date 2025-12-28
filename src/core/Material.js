export class Material {
  constructor({
    ambient = [0.08, 0.08, 0.08],
    diffuse = [1, 1, 1],
    specular = [0.6, 0.6, 0.6],
    shininess = 64,
    useTexture = false,
    useBlinnPhong = true,
    texture = null
  } = {}) {
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.shininess = shininess;
    this.useTexture = useTexture;
    this.useBlinnPhong = useBlinnPhong;
    this.texture = texture;
  }

  setTexture(tex) {
    this.texture = tex;
    return this;
  }

  apply(gl, program) {
    if (!program?.getUniformLocation) return;

    gl.uniform3fv(program.getUniformLocation("uKa"), new Float32Array(this.ambient));
    gl.uniform3fv(program.getUniformLocation("uKd"), new Float32Array(this.diffuse));
    gl.uniform3fv(program.getUniformLocation("uKs"), new Float32Array(this.specular));
    gl.uniform1f(program.getUniformLocation("uShininess"), this.shininess);
    gl.uniform1i(program.getUniformLocation("uUseTexture"), this.useTexture ? 1 : 0);
    gl.uniform1i(program.getUniformLocation("uUseBlinnPhong"), this.useBlinnPhong ? 1 : 0);

    if (this.texture?.bind) {
      this.texture.bind(0);
      gl.uniform1i(program.getUniformLocation("uAlbedoMap"), 0);
    }
  }
}
