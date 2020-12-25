export const shader = {
  vertexSrc: `
attribute vec3 position;
attribute vec4 color;

uniform mat4 projection;
uniform mat4 world2View;
uniform mat4 model2World;

varying lowp vec4 vColor;

void main() {
  gl_Position = projection * world2View * model2World * vec4(position, 1.0);
  vColor = color;
}
`,

  fragmentSrc: `
varying lowp vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`,

  attribs: ['position', 'color'],
  uniforms: ['model2World', 'projection', 'world2View'],
}
