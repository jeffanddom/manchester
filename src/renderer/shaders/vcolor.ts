export const shader = {
  vertexSrc: `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec4 aVertexColor;

uniform mat4 uProjection;
uniform mat4 uWorld2View;
uniform mat4 uModel2World;

out vec4 Color;
out vec3 Normal;

void main() {
  gl_Position = uProjection * uWorld2View * uModel2World * vec4(aPosition, 1.0);
  Color = aVertexColor;
  Normal = mat3(uWorld2View * uModel2World) * aNormal;
}
`,

  fragmentSrc: `#version 300 es
precision mediump float;

in vec4 Color;
in vec3 Normal;

out vec4 FragColor;

void main() {
  vec3 aNormal = normalize(Normal);
  float light = dot(aNormal, normalize(vec3(1, 0.5, 0))) * 0.4 + 0.6;
  FragColor = vec4(light * Color.rgb, Color.a);
}
`,
}
