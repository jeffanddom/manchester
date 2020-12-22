import { ClientMessage } from '~/network/ClientMessage'
import { ServerMessage } from '~/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IServerConnection {
  send(msg: ClientMessage): void
  consume(): ServerMessage[]
  close(): void
}

export class ServerConnectionWs implements IServerConnection {
  private socket: WebSocket
  private received: ServerMessage[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.received = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      this.received.push(JSON.parse(ev.data) as ServerMessage)
    })
  }

  send(msg: ClientMessage): void {
    this.socket.send(JSON.stringify(msg))
  }

  consume(): ServerMessage[] {
    const msgs = this.received // we may need to copy to prevent mutation?
    this.received = []
    return msgs
  }

  close(): void {
    this.socket.close()
  }
}

export function createServerConnectionWs(
  url: string,
): Promise<IServerConnection> {
  const socket = new WebSocket(url)
  return new Promise((resolve) => {
    socket.addEventListener('open', () => {
      resolve(new ServerConnectionWs(socket))
    })
  })
}
