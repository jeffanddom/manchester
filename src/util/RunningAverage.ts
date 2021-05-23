export class RunningAverage {
  private samples: Array<number>
  private maxSamples: number
  private avg: number

  constructor(maxSamples: number) {
    this.samples = []
    this.maxSamples = maxSamples
    this.avg = NaN
  }

  sample(s: number): void {
    if (this.samples.length === 0) {
      this.avg = s
    } else if (this.samples.length === this.maxSamples) {
      this.avg += (s - this.samples.shift()!) / this.maxSamples
    } else {
      this.avg =
        (this.avg * this.samples.length + s) / (this.samples.length + 1)
    }

    this.samples.push(s)
  }

  average(): number {
    return this.avg
  }
}
