import { mat2d, vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import { TILE_SIZE } from '~/constants'
import * as models from '~/models'
import { Primitive } from '~/renderer/interfaces'
import { CursorMode } from '~/systems/client/playerInput'
import { tileCoords, tileToWorld } from '~/util/tileMath'

export const update = (c: Client): void => {
  const mousePos = c.mouse!.getPos()
  if (mousePos) {
    const mouseWorldPos = c.camera.viewToWorldspace(mousePos)

    // crosshair (TODO: this could probably be moved to HUD rendering, which
    // uses viewspace)
    const topLeft = vec2.sub(
      vec2.create(),
      mouseWorldPos,
      vec2.fromValues(3, 3),
    )
    const d = vec2.fromValues(6, 6)
    // c.renderer.render({
    //   primitive: Primitive.RECT,
    //   strokeStyle: 'black',
    //   fillStyle: 'white',
    //   pos: topLeft,
    //   dimensions: d,
    // })

    // tile indicator
    if (c.playerInputState.cursorMode !== CursorMode.NONE) {
      const tileWorldPos = tileToWorld(tileCoords(topLeft))

      // c.renderer.render({
      //   primitive: Primitive.RECT,
      //   strokeStyle: 'rgba(255, 255, 0, 0.7)',
      //   fillStyle: 'rgba(0, 0, 0, 0)',
      //   pos: vec2.sub(
      //     vec2.create(),
      //     tileWorldPos,
      //     vec2.fromValues(TILE_SIZE / 2, TILE_SIZE / 2),
      //   ),
      //   dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
      // })

      // c.renderer.setGlobalOpacity(0.5)

      // switch (c.playerInputState.cursorMode) {
      //   case CursorMode.HARVEST:
      //     toRenderables(models.harvestIcon, {
      //       worldTransform: mat2d.fromTranslation(mat2d.create(), tileWorldPos),
      //     }).forEach((r) => c.renderer.render(r))
      //     break
      //   case CursorMode.BUILD_TURRET:
      //     toRenderables(models.turret, {
      //       worldTransform: mat2d.fromTranslation(mat2d.create(), tileWorldPos),
      //     }).forEach((r) => c.renderer.render(r))
      //     break
      //   case CursorMode.BUILD_WALL:
      //     toRenderables(models.wall, {
      //       worldTransform: mat2d.fromTranslation(mat2d.create(), tileWorldPos),
      //     }).forEach((r) => c.renderer.render(r))
      //     break
      //   case CursorMode.MOVE_BUILDER:
      //     toRenderables(models.builder, {
      //       worldTransform: mat2d.fromTranslation(mat2d.create(), tileWorldPos),
      //     }).forEach((r) => c.renderer.render(r))
      //     break
      // }

      // c.renderer.setGlobalOpacity(1)
    }
  }
}
