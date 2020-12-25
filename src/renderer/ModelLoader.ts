import { ModelDef } from '~/renderer/common'

export interface IModelLoader {
  loadModel: (modelName: string, model: ModelDef, shaderName: string) => void
}

export class StubModelLoader implements IModelLoader {
  loadModel(_modelName: string, _model: ModelDef, _shaderName: string): void {
    /* do nothing */
  }
}
