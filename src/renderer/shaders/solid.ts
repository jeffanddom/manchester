/**
 * The solid shader provides monochrome models with vertex normals.
 */

export const shader = {
  vertexSrc: `#version 300 es
in vec3 position;
in vec3 normal;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

out vec3 Normal;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  Normal = mat3(world2View * model2World) * normal;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;
uniform vec4 color;
in vec3 Normal;
out vec4 FragColor;

void main() {
  vec3 normal = normalize(Normal);
  float light = dot(normal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  FragColor = vec4(light * color.rgb, color.a);
}
`,

  attribs: ['position', 'normal'],
  uniforms: ['projection', 'world2View', 'model2World', 'color'],
}
