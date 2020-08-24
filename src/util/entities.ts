import * as _ from 'lodash'

import { Entity } from '~/entities/Entity'
import { DataEntity } from '~/ServerMessage'

export const convertToServerMessage = (current: {
  [key: string]: Entity
}): DataEntity[] => {
  return _.map(current, (value, key) => {
    return {
      id: key,
      type: value.type,
      transform: _.clone(value.transform),
    }
  })
}
