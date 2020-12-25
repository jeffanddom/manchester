export const shader = {
  vertexSrc: `
attribute vec3 position;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

varying lowp vec4 vColor;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  vColor = aVertexColor;
}
`,

  fragmentSrc: `
uniform vec4 color;

void main() {
  gl_FragColor = color;
}
`,

  attribs: ['position'],
  uniforms: ['model2World', 'projection', 'world2View', 'color'],
}
