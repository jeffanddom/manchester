export class DedupLog {
  logsByFrame: Map<number, Set<string>>

  constructor() {
    this.logsByFrame = new Map()
  }

  add(frameNumber: number, eventKey: string | undefined): void {
    if (eventKey !== undefined) {
      let frameSet = this.logsByFrame.get(frameNumber)

      if (frameSet === undefined) {
        frameSet = new Set()
        this.logsByFrame.set(frameNumber, frameSet)
      }

      frameSet.add(eventKey)
    }
  }

  contains(frameNumber: number, eventKey: string | undefined): boolean {
    const frameSet = this.logsByFrame.get(frameNumber)
    return (
      frameSet !== undefined && eventKey !== undefined && frameSet.has(eventKey)
    )
  }

  // trunacteBefore(frameNumber: number)
}
