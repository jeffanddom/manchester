/**
 * Wiresolids are rendered with a stroke and fill attribute. Vertexes require
 * an edgeOn attribute to determine proximity to an edge.
 */

export const shader = {
  vertexSrc: `#version 300 es
in vec3 position;
in vec3 normal;
in vec3 edgeOn;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

out vec3 Normal;
out vec3 EdgeOn;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  Normal = mat3(world2View * model2World) * normal;
  EdgeOn = edgeOn;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

uniform vec4 color;

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
  vec3 normal = normalize(Normal);
  float light = dot(normal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  FragColor = vec4(light * mix(color.rgb, vec3(0.0), lerpAlpha()), 1);
}
`,

  attribs: ['position', 'normal', 'edgeOn'],
  uniforms: ['projection', 'world2View', 'model2World', 'color'],
}
