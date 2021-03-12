/**
 * The paritcle shader provides monochrome models.
 * Transforms and colors are passed as instance attribs.
 */

export const shader = {
  vertexSrc: `#version 300 es
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in mat4 a_model2World;

uniform mat4 projection;
uniform mat4 world2View;

out vec4 color;

void main() {
  gl_Position = projection * world2View * a_model2World * vec4(a_position, 1.0);
  color = a_color;
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
