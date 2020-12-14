const scale = 1/8
const model = `
v  -0.5  0.0  -0.5
v  -0.5  0.0  0.5
v  -0.5  1.0  -0.5
v  -0.5  1.0  0.5
v  0.5  0.0  -0.5
v  0.5  0.0  0.5
v  0.5  1.0  -0.5
v  0.5  1.0  0.5
usemtl bullet
f  1  7  5
f  1  3  7
f  1  4  3
f  1  2  4
f  3  8  7
f  3  4  8
f  5  7  8
f  5  8  6
f  1  5  6
f  1  6  2
f  2  6  8
f  2  8  4
`

export const bullet = {
  scale,
  model
}