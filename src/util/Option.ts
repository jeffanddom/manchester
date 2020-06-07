/**
 * An option type with an interface inspired by Rust's Option type.
 * See https://doc.rust-lang.org/std/option/enum.Option.html
 */

export const Some = <T>(value: T): Option<T> => {
  return new SomeOption(value)
}

// TODO: figure out if we can use a common None instance.
export const None = <T>(): Option<T> => {
  return new NoneOption()
}

export interface Option<T> {
  /**
   * Returns true if the option wraps a value, or false otherwise.
   */
  isSome(): boolean

  /**
   * Returns false if the option does not wrap a value, or false otherwise.
   */
  isNone(): boolean

  /**
   * If both options wrap values, returns the result of strict equality
   * comparison between the two wrapped values. If neither option wraps a value,
   * return true. Otherwise returns false.
   */
  equals(other: Option<T>): boolean

  /**
   * If both options wrap values, returns the result of weak equality
   * comparison between the two wrapped values. If neither option wraps a value,
   * return true. Otherwise returns false.
   */
  weakEquals(other: Option<T>): boolean

  /**
   * Returns the wrapped value. Throws an exception if the option does not wrap
   * a value.
   */
  unwrap(): T

  /**
   * Returns the wrapped value if the option wraps a value, or returns the
   * provided default value.
   */
  unwrapOr(def: T): T

  /**
   * A lazy-evaluated version of #unwrapOr.
   *
   * Returns the wrapped value if the option wraps a value, or returns the
   * result of calling the provided function.
   */
  unwrapOrElse(def: () => T): T

  /**
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function, wrapped in another option. Otherwise,
   * returns a new none option.
   */
  map<MappedT>(f: (v: T) => MappedT): Option<MappedT>

  /**
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function. Otherwise, returns the provided default
   * value.
   */
  mapOr<MappedT>(def: MappedT, f: (v: T) => MappedT): MappedT

  /**
   * A lazy-evaluated version of #mapOr.
   *
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function. Otherwise, returns the result of calling
   * the provided default value function.
   */
  mapOrElse<MappedT>(def: () => MappedT, f: (v: T) => MappedT): MappedT
}

export const UNWRAP_ERROR = 'unwrapping none option'

class SomeOption<T> implements Option<T> {
  private wrapped: T

  public constructor(value: T) {
    this.wrapped = value
  }

  public isSome(): boolean {
    return true
  }

  public isNone(): boolean {
    return false
  }

  public equals(other: Option<T>): boolean {
    return other.isSome() && this.wrapped === other.unwrap()
  }

  public weakEquals(other: Option<T>): boolean {
    return other.isSome() && this.wrapped == other.unwrap()
  }

  public unwrap(): T {
    return this.wrapped
  }

  public unwrapOr(_def: T): T {
    return this.wrapped
  }

  public unwrapOrElse(_def: () => T): T {
    return this.wrapped
  }

  public map<MappedT>(f: (v: T) => MappedT): Option<MappedT> {
    return new SomeOption(f(this.wrapped))
  }

  public mapOr<MappedT>(_def: MappedT, f: (v: T) => MappedT): MappedT {
    return f(this.wrapped)
  }

  public mapOrElse<MappedT>(
    _def: () => MappedT,
    f: (v: T) => MappedT,
  ): MappedT {
    return f(this.wrapped)
  }
}

class NoneOption<T> implements Option<T> {
  public isSome(): boolean {
    return false
  }

  public isNone(): boolean {
    return true
  }

  public equals(other: Option<T>): boolean {
    return other.isNone()
  }

  public weakEquals(other: Option<T>): boolean {
    return other.isNone()
  }

  public unwrap(): T {
    throw new Error(UNWRAP_ERROR)
  }

  public unwrapOr(def: T): T {
    return def
  }

  public unwrapOrElse(def: () => T): T {
    return def()
  }

  public map<MappedT>(_f: (v: T) => MappedT): Option<MappedT> {
    return None()
  }

  public mapOr<MappedT>(def: MappedT, _f: (v: T) => MappedT): MappedT {
    return def
  }

  public mapOrElse<MappedT>(
    def: () => MappedT,
    _f: (v: T) => MappedT,
  ): MappedT {
    return def()
  }
}
