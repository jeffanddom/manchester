/**
 * The paritcle shader provides monochrome models.
 * Transforms and colors are passed as instance attribs.
 */

export const shader = {
  vertexSrc: `#version 300 es
in vec3 aPosition;
in vec4 aInstanceColor;
in mat4 aInstanceTransform;

uniform mat4 uProjection;
uniform mat4 uWorld2View;

out vec4 color;

void main() {
  gl_Position = uProjection * uWorld2View * aInstanceTransform * vec4(aPosition, 1.0);
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
