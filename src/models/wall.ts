import { vec3 } from 'gl-matrix'

const obj = `
mtllib cube.mtl
o Cube
v 1 -1 -1
v 1 -1 1
v -1 -1 1
v -1 -1 -1
v 1 1 -1
v 1 1 1
v -1 1 1
v -1 1 -1
vn 0 -1 0
vn 0 1 0
vn 1 0 0
vn -0 0 1
vn -1 -0 -0
vn 0 0 -1
usemtl wall
s off
f 2/1/1 3/2/1 4/3/1
f 8/1/2 7/4/2 6/5/2
f 5/6/3 6/7/3 2/8/3
f 6/8/4 7/5/4 3/4/4
f 3/9/5 7/10/5 8/11/5
f 1/12/6 4/13/6 8/11/6
f 1/4/1 2/1/1 4/3/1
f 5/14/2 8/1/2 6/5/2
f 1/12/3 5/6/3 2/8/3
f 2/12/4 6/8/4 3/4/4
f 4/13/5 3/9/5 8/11/5
f 5/6/6 1/12/6 8/11/6
`

export const model = {
  scale: 0.5,
  translate: vec3.fromValues(0, 0.5, 0),
  obj,
}
