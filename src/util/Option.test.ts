import { Option } from '~/util/Option'

test('Option#isSome', () => {
  expect(Option.some(3).isSome()).toBe(true)
  expect(Option.some<number | undefined>(undefined).isSome()).toBe(true)
  expect(Option.none().isSome()).toBe(false)
})

test('Option#isNone', () => {
  expect(Option.some(3).isNone()).toBe(false)
  expect(Option.some<number | undefined>(undefined).isNone()).toBe(false)
  expect(Option.none().isNone()).toBe(true)
})

test('Option#equals', () => {
  expect(Option.none().equals(Option.none())).toBe(true)
  expect(Option.some(3).equals(Option.some(3))).toBe(true)
  expect(Option.some(3).equals(Option.some(4))).toBe(false)
  expect(Option.some(undefined).equals(Option.some(null))).toBe(false)
})

test('Option#weakEquals', () => {
  expect(Option.none().weakEquals(Option.none())).toBe(true)
  expect(Option.some(3).weakEquals(Option.some(3))).toBe(true)
  expect(Option.some(3).weakEquals(Option.some(4))).toBe(false)
  expect(Option.some(undefined).weakEquals(Option.some(null))).toBe(true)
})

test('Option#unwrap', () => {
  expect(Option.some(3).unwrap()).toBe(3)
  expect(Option.some<number | undefined>(undefined).unwrap()).toBe(undefined)
  expect(() => Option.none().unwrap()).toThrowError(Option.UNWRAP_ERROR)
})

test('Option#unwrapOr', () => {
  expect(Option.some(3).unwrapOr(4)).toBe(3)
  expect(Option.some<number | undefined>(undefined).unwrapOr(3)).toBe(undefined)
  expect(Option.none().unwrapOr(3)).toBe(3)
})

test('Option#unwrapOrElse', () => {
  expect(Option.some(3).unwrapOrElse(() => 4)).toBe(3)
  expect(Option.some<number | undefined>(undefined).unwrapOrElse(() => 3)).toBe(
    undefined,
  )
  expect(Option.none().unwrapOrElse(() => 3)).toBe(3)
})

test('Option#map', () => {
  expect(
    Option.some(3)
      .map((v) => v + 1)
      .unwrap(),
  ).toBe(4)
  expect(
    Option.some<number | undefined>(undefined)
      .map((v) => typeof v)
      .unwrap(),
  ).toBe('undefined')
  expect(
    Option.none<number>()
      .map((v) => v + 1)
      .isNone(),
  ).toBe(true)
})

test('Option#mapOr', () => {
  expect(Option.some(3).mapOr(2, (v) => v + 1)).toBe(4)
  expect(
    Option.some<number | undefined>(undefined).mapOr('number', (v) => typeof v),
  ).toBe('undefined')
  expect(Option.none<number>().mapOr(2, (v) => v + 1)).toBe(2)
})

test('Option#mapOrElse', () => {
  expect(
    Option.some(3).mapOrElse(
      () => 2,
      (v) => v + 1,
    ),
  ).toBe(4)
  expect(
    Option.some<number | undefined>(undefined).mapOrElse(
      () => 'number',
      (v) => typeof v,
    ),
  ).toBe('undefined')
  expect(
    Option.none<number>().mapOrElse(
      () => 2,
      (v) => v + 1,
    ),
  ).toBe(2)
})
