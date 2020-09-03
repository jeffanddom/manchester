import { ClientMessage } from './ClientMessage'

export interface ServerMessage {
  frame: number
  inputs: ClientMessage[]
}
