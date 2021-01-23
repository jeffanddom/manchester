import * as gltf from '~/renderer/gltf'
import { ModelDef } from '~/renderer/interfaces'

export interface IModelLoader {
  loadModel: (modelName: string, model: ModelDef, shaderName: string) => void
  loadGltf: (doc: gltf.Document) => void
}

export class StubModelLoader implements IModelLoader {
  loadModel(_modelName: string, _model: ModelDef, _shaderName: string): void {
    /* do nothing */
  }

  loadGltf(_doc: gltf.Document): void {
    /* do nothing */
  }
}
