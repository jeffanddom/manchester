import { ModelNode } from './interfaces'
import { ModelDef } from './interfacesOld'

export interface IModelLoader {
  loadModelDef: (modelName: string, model: ModelDef, shaderName: string) => void
  loadModel: (name: string, root: ModelNode) => void
}

export class StubModelLoader implements IModelLoader {
  loadModelDef(
    _modelName: string,
    _model: ModelDef,
    _shaderName: string,
  ): void {
    /* do nothing */
  }

  loadModel(_name: string, _root: ModelNode): void {
    /* do nothing */
  }
}
