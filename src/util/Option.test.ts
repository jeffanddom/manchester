import { None, Some, UNWRAP_ERROR } from '~/util/Option'

test('Option#isSome', () => {
  expect(Some(3).isSome()).toBe(true)
  expect(Some<number | undefined>(undefined).isSome()).toBe(true)
  expect(None().isSome()).toBe(false)
})

test('Option#isNone', () => {
  expect(Some(3).isNone()).toBe(false)
  expect(Some<number | undefined>(undefined).isNone()).toBe(false)
  expect(None().isNone()).toBe(true)
})

test('Option#equals', () => {
  expect(None().equals(None())).toBe(true)
  expect(Some(3).equals(Some(3))).toBe(true)
  expect(Some(3).equals(Some(4))).toBe(false)
  expect(Some(undefined).equals(Some(null))).toBe(false)
})

test('Option#weakEquals', () => {
  expect(None().weakEquals(None())).toBe(true)
  expect(Some(3).weakEquals(Some(3))).toBe(true)
  expect(Some(3).weakEquals(Some(4))).toBe(false)
  expect(Some(undefined).weakEquals(Some(null))).toBe(true)
})

test('Option#unwrap', () => {
  expect(Some(3).unwrap()).toBe(3)
  expect(Some<number | undefined>(undefined).unwrap()).toBe(undefined)
  expect(() => None().unwrap()).toThrowError(UNWRAP_ERROR)
})

test('Option#unwrapOr', () => {
  expect(Some(3).unwrapOr(4)).toBe(3)
  expect(Some<number | undefined>(undefined).unwrapOr(3)).toBe(undefined)
  expect(None().unwrapOr(3)).toBe(3)
})

test('Option#unwrapOrElse', () => {
  expect(Some(3).unwrapOrElse(() => 4)).toBe(3)
  expect(Some<number | undefined>(undefined).unwrapOrElse(() => 3)).toBe(
    undefined,
  )
  expect(None().unwrapOrElse(() => 3)).toBe(3)
})

test('Option#map', () => {
  expect(
    Some(3)
      .map((v) => v + 1)
      .unwrap(),
  ).toBe(4)
  expect(
    Some<number | undefined>(undefined)
      .map((v) => typeof v)
      .unwrap(),
  ).toBe('undefined')
  expect(
    None<number>()
      .map((v) => v + 1)
      .isNone(),
  ).toBe(true)
})

test('Option#mapOr', () => {
  expect(Some(3).mapOr(2, (v) => v + 1)).toBe(4)
  expect(
    Some<number | undefined>(undefined).mapOr('number', (v) => typeof v),
  ).toBe('undefined')
  expect(None<number>().mapOr(2, (v) => v + 1)).toBe(2)
})

test('Option#mapOrElse', () => {
  expect(
    Some(3).mapOrElse(
      () => 2,
      (v) => v + 1,
    ),
  ).toBe(4)
  expect(
    Some<number | undefined>(undefined).mapOrElse(
      () => 'number',
      (v) => typeof v,
    ),
  ).toBe('undefined')
  expect(
    None<number>().mapOrElse(
      () => 2,
      (v) => v + 1,
    ),
  ).toBe(2)
})
