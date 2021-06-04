import { ServerMessage } from '~/engine/network/ServerMessage'

/**
 * Models a connection to a client.
 */
export interface IServerConnection<TClientMessage> {
  send(msg: TClientMessage): void
  consume(): ServerMessage<TClientMessage>[]
  close(): void
}

export class ServerConnectionWs<TClientMessage>
  implements IServerConnection<TClientMessage> {
  private socket: WebSocket
  private received: ServerMessage<TClientMessage>[]

  constructor(socket: WebSocket) {
    this.socket = socket
    this.received = []

    this.socket.addEventListener('message', (ev) => {
      // TODO: validate, find a way to convey parse/validation errs
      this.received.push(JSON.parse(ev.data) as ServerMessage<TClientMessage>)
    })
  }

  send(msg: TClientMessage): void {
    this.socket.send(JSON.stringify(msg))
  }

  consume(): ServerMessage<TClientMessage>[] {
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
