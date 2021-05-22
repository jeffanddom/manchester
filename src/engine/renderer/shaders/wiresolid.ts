/**
 * Wiresolids are rendered with a stroke and fill attribute. Vertexes require
 * an aEdgeOn attribute to determine proximity to an edge.
 */

export const shader = {
  vertexSrc: `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec3 aEdgeOn;

uniform mat4 uProjection;
uniform mat4 uWorld2View;
uniform mat4 uModel2World;

out vec3 Normal;
out vec3 EdgeOn;

void main() {
  gl_Position = uProjection * uWorld2View * uModel2World * vec4(aPosition, 1.0);
  Normal = mat3(uWorld2View * uModel2World) * aNormal;
  EdgeOn = aEdgeOn;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

uniform vec4 uColor;

in vec3 Normal;
in vec3 EdgeOn;

out vec4 FragColor;

float lerpAlpha() {
  vec3 inv = vec3(1) - EdgeOn;
  vec3 delta = fwidth(inv);
  vec3 a3 = smoothstep(vec3(0.0), delta * 1.25, inv);
  return min(min(a3.x, a3.y), a3.z);
}

void main() {
  vec3 aNormal = normalize(Normal);
  float light = dot(aNormal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  FragColor = vec4(light * mix(uColor.rgb, vec3(0.0), lerpAlpha()), 1);
}
`,
}
