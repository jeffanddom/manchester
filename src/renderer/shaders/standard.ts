export const shader = {
  vertexSrc: `#version 300 es
in vec3 position;
in vec4 color;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

out vec4 Color;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  Color = color;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;
in vec4 Color;
out vec4 FragColor;

void main() {
  FragColor = Color;
}
`,

  attribs: ['position', 'color'],
  uniforms: ['projection', 'world2View', 'model2World'],
}
