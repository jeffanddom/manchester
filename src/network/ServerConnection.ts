import { ClientMessage } from '~/network/ClientMessage'
import { ServerMessage } from '~/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IServerConnection {
  send(msg: ClientMessage): void
  received(): ServerMessage[]
  clear(): void
}

export class ServerConnectionWs implements IServerConnection {
  private socket: WebSocket
  private recvq: ServerMessage[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.recvq = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      this.recvq.push(JSON.parse(ev.data) as ServerMessage)
    })
  }

  send(msg: ClientMessage): void {
    this.socket.send(JSON.stringify(msg))
  }

  received(): ServerMessage[] {
    return this.recvq // we may need to copy to prevent mutation?
  }

  clear(): void {
    this.recvq = []
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
