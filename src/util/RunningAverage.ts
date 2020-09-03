export class RunningAverage {
  samples: Array<number>
  maxSamples: number

  constructor(maxSamples: number) {
    this.samples = []
    this.maxSamples = maxSamples
  }

  sample(s: number): void {
    if (this.samples.length === this.maxSamples) {
      this.samples.shift()
    }
    this.samples.push(s)
  }

  average(): number {
    return this.samples.reduce((accum, s) => accum + s, 0) / this.samples.length
  }
}
