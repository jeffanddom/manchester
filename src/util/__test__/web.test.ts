import { floatRgbToWebcolor, webcolorToFloatRgb } from '../web'

describe('webcolorToFloatRgb', () => {
  it('basic functionality', () => {
    expect(webcolorToFloatRgb('000000')).toEqual([0, 0, 0])
    expect(webcolorToFloatRgb('#000000')).toEqual([0, 0, 0])
    expect(webcolorToFloatRgb('FFFFFF')).toEqual([1, 1, 1])
    expect(webcolorToFloatRgb('#FFFFFF')).toEqual([1, 1, 1])

    let got = webcolorToFloatRgb('123456')
    expect(got[0]).toBeCloseTo(0.07, 2)
    expect(got[1]).toBeCloseTo(0.2, 2)
    expect(got[2]).toBeCloseTo(0.34, 2)

    got = webcolorToFloatRgb('ABCDEF')
    expect(got[0]).toBeCloseTo(0.67, 2)
    expect(got[1]).toBeCloseTo(0.8, 2)
    expect(got[2]).toBeCloseTo(0.94, 2)
  })
})

describe('floatRgbToWebcolor', () => {
  it('basic functionality', () => {
    expect(floatRgbToWebcolor([0, 0, 0])).toEqual('#000000')
    expect(floatRgbToWebcolor([1, 1, 1])).toEqual('#ffffff')
    expect(floatRgbToWebcolor([0.07, 0.205, 0.337])).toEqual('#123456')
    expect(floatRgbToWebcolor([0.67, 0.805, 0.937])).toEqual('#abcdef')
  })
})
