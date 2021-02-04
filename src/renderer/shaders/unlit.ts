import { ShaderAttribLoc } from './common'

export const shader = {
  vertexSrc: `#version 300 es
layout(location = ${ShaderAttribLoc.Position}) in vec3 position;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;
 
void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

uniform vec4 color;

out vec4 FragColor;

void main() {
  FragColor = color;
}
`,
}
