#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec2 vUV;

out vec4 outColor;

struct DirectionalLight {
  vec3 direction;
  vec3 color;
  float intensity;
};

struct PointLight {
  vec3 position;
  vec3 color;
  float intensity;
  float constant;
  float linear;
  float quadratic;
};

uniform vec3 uCameraPos;

uniform DirectionalLight uDirLight;
uniform PointLight uPointLight;

uniform vec3 uKa;
uniform vec3 uKd;
uniform vec3 uKs;
uniform float uShininess;

uniform bool uUseBlinnPhong;

// Step 7: texture
uniform sampler2D uAlbedoMap;
uniform bool uUseTexture;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);

  // BaseColor: from texture or fallback Kd
  vec3 baseColor = uKd;
  if (uUseTexture) {
    baseColor = texture(uAlbedoMap, vUV).rgb;
  }

  // Ambient
  vec3 ambient = uKa * baseColor;

  // Directional
  vec3 Ld = normalize(-uDirLight.direction);
  float ndotl_d = max(dot(N, Ld), 0.0);
  vec3 diffuse_d = baseColor * ndotl_d * uDirLight.color * uDirLight.intensity;

  vec3 spec_d = vec3(0.0);
  if (ndotl_d > 0.0) {
    if (uUseBlinnPhong) {
      vec3 H = normalize(Ld + V);
      float ndoth = max(dot(N, H), 0.0);
      spec_d = uKs * pow(ndoth, uShininess) * uDirLight.color * uDirLight.intensity;
    } else {
      vec3 R = reflect(-Ld, N);
      float rdotv = max(dot(R, V), 0.0);
      spec_d = uKs * pow(rdotv, uShininess) * uDirLight.color * uDirLight.intensity;
    }
  }

  // Point
  vec3 LpVec = uPointLight.position - vWorldPos;
  float dist = length(LpVec);
  vec3 Lp = normalize(LpVec);

  float attenuation = 1.0 / (uPointLight.constant +
                             uPointLight.linear * dist +
                             uPointLight.quadratic * dist * dist);

  float ndotl_p = max(dot(N, Lp), 0.0);
  vec3 diffuse_p = baseColor * ndotl_p * uPointLight.color * uPointLight.intensity;

  vec3 spec_p = vec3(0.0);
  if (ndotl_p > 0.0) {
    if (uUseBlinnPhong) {
      vec3 H = normalize(Lp + V);
      float ndoth = max(dot(N, H), 0.0);
      spec_p = uKs * pow(ndoth, uShininess) * uPointLight.color * uPointLight.intensity;
    } else {
      vec3 R = reflect(-Lp, N);
      float rdotv = max(dot(R, V), 0.0);
      spec_p = uKs * pow(rdotv, uShininess) * uPointLight.color * uPointLight.intensity;
    }
  }

  vec3 color = ambient
             + (diffuse_d + spec_d)
             + attenuation * (diffuse_p + spec_p);

  outColor = vec4(color, 1.0);
}
