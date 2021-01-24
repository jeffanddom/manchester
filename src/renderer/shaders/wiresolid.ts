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

void main() {
  vec3 normal = normalize(Normal);
  float light = dot(normal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  if (max(max(EdgeOn.x, EdgeOn.y), EdgeOn.z) > 0.9) {
    FragColor = vec4(light * vec3(1,1,1), color.a);
  } else {
    FragColor = vec4(0,0,0,1.0);
  }
}
`,

  attribs: ['position', 'normal', 'edgeOn'],
  uniforms: ['projection', 'world2View', 'model2World', 'color'],
}
