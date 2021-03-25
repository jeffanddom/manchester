/**
 * The paritcle shader provides monochrome models.
 * Transforms and colors are passed as instance attribs.
 */

export const shader = {
  vertexSrc: `#version 300 es
in vec3 aPosition;
in vec4 aInstanceColor;
in vec4 aInstanceRotation;
in vec3 aInstanceScale;
in vec3 aInstanceTranslation;
in float aInstanceActive;

uniform mat4 uProjection;
uniform mat4 uWorld2View;

out vec4 color;

mat4 fromRotationTranslationScale(vec4 q, vec3 t, vec3 s) {
  vec3 v2 = 2.0 * q.xyz;

  vec3 vx = q.x * v2;
  vec3 vy = q.y * v2;
  vec3 vz = q.z * v2;
  vec3 vw = q.w * v2;

  mat4 result;

  result[0][0] = (1.0 - (vy.y + vz.z)) * s.x;
  result[0][1] = (vx.y + vw.z) * s.x;
  result[0][2] = (vx.z - vw.y) * s.x;
  result[0][3] = 0.0;
  result[1][0] = (vx.y - vw.z) * s.y;
  result[1][1] = (1.0 - (vx.x + vz.z)) * s.y;
  result[1][2] = (vy.z + vw.x) * s.y;
  result[1][3] = 0.0;
  result[2][0] = (vx.z + vw.y) * s.z;
  result[2][1] = (vy.z - vw.x) * s.z;
  result[2][2] = (1.0 - (vx.x + vy.y)) * s.z;
  result[2][3] = 0.0;
  result[3][0] = t.x;
  result[3][1] = t.y;
  result[3][2] = t.z;
  result[3][3] = 1.0;

  return result;
}

void main() {
  if (aInstanceActive == 0.0) {
    // position outside of clip volume
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  mat4 transform = fromRotationTranslationScale(aInstanceRotation, aInstanceTranslation, aInstanceScale);
  gl_Position = uProjection * uWorld2View * transform * vec4(aPosition, 1.0);
  color = aInstanceColor;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

in vec4 color;
out vec4 FragColor;

void main() {
  FragColor = color;
}
`,
}
