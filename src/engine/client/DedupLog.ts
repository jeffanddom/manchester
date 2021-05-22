import { FrameEvent, FrameEventType } from '~/game/systems/FrameEvent'

const frameEventToKey = (event: FrameEvent): string | undefined => {
  switch (event.type) {
    case FrameEventType.TankShoot:
      return `${FrameEventType[event.type]}:${event.entityId}`
    default:
      return undefined
  }
}

export class DedupLog {
  logsByFrame: Map<number, Set<string>>

  constructor() {
    this.logsByFrame = new Map()
  }

  add(frameNumber: number, event: FrameEvent): void {
    const eventKey = frameEventToKey(event)
    if (eventKey !== undefined) {
      let frameSet = this.logsByFrame.get(frameNumber)

      if (frameSet === undefined) {
        frameSet = new Set()
        this.logsByFrame.set(frameNumber, frameSet)
      }

      frameSet.add(eventKey)
    }
  }

  contains(frameNumber: number, event: FrameEvent): boolean {
    const frameSet = this.logsByFrame.get(frameNumber)
    const eventKey = frameEventToKey(event)

    return (
      frameSet !== undefined && eventKey !== undefined && frameSet.has(eventKey)
    )
  }

  // trunacteBefore(frameNumber: number)
}
