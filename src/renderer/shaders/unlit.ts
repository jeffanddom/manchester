export const shader = {
  vertexSrc: `#version 300 es
in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uWorld2View;
uniform mat4 uModel2World;
 
void main() {
  gl_Position = uProjection * uWorld2View * uModel2World * vec4(aPosition, 1.0);
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

uniform vec4 uColor;

out vec4 FragColor;

void main() {
  FragColor = uColor;
}
`,
}
