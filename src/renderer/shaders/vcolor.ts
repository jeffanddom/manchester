import { ShaderAttribLoc } from './common'

export const shader = {
  vertexSrc: `#version 300 es
layout(location = ${ShaderAttribLoc.Position}) in vec3 position;
layout(location = ${ShaderAttribLoc.Normal}) in vec3 normal;
layout(location = ${ShaderAttribLoc.Color}) in vec4 color;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

out vec4 Color;
out vec3 Normal;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  Color = color;
  Normal = mat3(world2View * model2World) * normal;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

in vec4 Color;
in vec3 Normal;

out vec4 FragColor;

void main() {
  vec3 normal = normalize(Normal);
  float light = dot(normal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  FragColor = vec4(light * Color.rgb, Color.a);
}
`,
}
