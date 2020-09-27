import * as WebSocket from 'ws'

import { ClientMessage } from '~/network/ClientMessage'
import { ServerMessage } from '~/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IClientConnection {
  send(msg: ServerMessage): void
  received(): ClientMessage[]
  clear(): void
}

export class ClientConnectionWs implements IClientConnection {
  private socket: WebSocket
  private recvq: ClientMessage[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.recvq = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      this.recvq.push(JSON.parse(ev.data) as ClientMessage)
    })
  }

  send(msg: ServerMessage): void {
    this.socket.send(JSON.stringify(msg))
  }

  received(): ClientMessage[] {
    return this.recvq // we may need to copy to prevent mutation?
  }

  clear(): void {
    this.recvq = []
  }
}
