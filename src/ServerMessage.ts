import { ITransform } from '~/components/transform'
import { Type } from '~/entities/types'

export interface DataEntity {
  id: string
  type?: Type
  transform?: ITransform
}

export interface ServerMessage {
  frame: number
  entities: DataEntity[]
}
