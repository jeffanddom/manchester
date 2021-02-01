import { ModelNode } from './interfaces'

export interface IModelLoader {
  loadModel: (name: string, root: ModelNode) => void
}

export class StubModelLoader implements IModelLoader {
  loadModel(_name: string, _root: ModelNode): void {
    /* do nothing */
  }
}
