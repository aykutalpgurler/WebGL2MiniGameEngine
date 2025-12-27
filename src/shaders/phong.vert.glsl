#version 300 es
precision highp float;

layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec2 vUV;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;

  // correct normal transform
  mat3 normalMat = mat3(transpose(inverse(uModel)));
  vWorldNormal = normalize(normalMat * aNormal);

  vUV = aUV;
  gl_Position = uProjection * uView * worldPos;
}
