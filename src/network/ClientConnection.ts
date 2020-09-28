import * as WebSocket from 'ws'

import { ClientMessage } from '~/network/ClientMessage'
import { ServerMessage } from '~/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IClientConnection {
  send(msg: ServerMessage): void
  consume(): ClientMessage[]
}

export class ClientConnectionWs implements IClientConnection {
  private socket: WebSocket
  private received: ClientMessage[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.received = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      this.received.push(JSON.parse(ev.data) as ClientMessage)
    })
  }

  send(msg: ServerMessage): void {
    this.socket.send(JSON.stringify(msg))
  }

  consume(): ClientMessage[] {
    const msgs = this.received
    this.received = []
    return msgs
  }
}
