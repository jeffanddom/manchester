import { ModelDef } from './interfacesOld'

import * as gltf from '~/renderer/gltf'

export interface IModelLoader {
  loadModelDef: (modelName: string, model: ModelDef, shaderName: string) => void
  loadGltf: (doc: gltf.Document) => void
}

export class StubModelLoader implements IModelLoader {
  loadModelDef(
    _modelName: string,
    _model: ModelDef,
    _shaderName: string,
  ): void {
    /* do nothing */
  }

  loadGltf(_doc: gltf.Document): void {
    /* do nothing */
  }
}
