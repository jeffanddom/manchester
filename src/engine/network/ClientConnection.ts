import * as WebSocket from 'ws'

import { ClientMessage } from '~/engine/network/ClientMessage'
import { ServerMessage } from '~/engine/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IClientConnection {
  send(msg: ServerMessage<ClientMessage>): void
  consume(): ClientMessage[]
  close(): void
}

export class ClientConnectionWs implements IClientConnection {
  private socket: WebSocket
  private received: ClientMessage[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.received = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      const incoming = JSON.parse(ev.data) as ClientMessage
      this.received.push(incoming)
    })
  }

  send(msg: ServerMessage<ClientMessage>): void {
    this.socket.send(JSON.stringify(msg))
  }

  consume(): ClientMessage[] {
    const msgs = this.received
    this.received = []
    return msgs
  }

  close(): void {
    this.socket.close()
  }
}
