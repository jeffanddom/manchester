import { ModelNode, RenderNode } from '~/renderer/common'

export const getGLLineMesh: (
  m: ModelNode,
  gl: WebGL2RenderingContext,
) => RenderNode = (model, gl) => {
  console.log(model, gl)
  throw 'Unimplemented'
}
