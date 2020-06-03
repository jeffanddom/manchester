/**
 * An option type with an interface inspired by Rust's Option type.
 * See https://doc.rust-lang.org/std/option/enum.Option.html
 */
export class Option<T> {
  public static readonly UNWRAP_ERROR = 'unwrapping none option'

  private wrapped: T | undefined
  private some: boolean

  private constructor() {}

  /**
   * Returns a new option that wraps the provided value.
   */
  public static some<T>(v: T): Option<T> {
    const option = new Option<T>()
    option.wrapped = v
    option.some = true
    return option
  }

  /**
   * Returns a new option that does not wrap a value.
   */
  public static none<T>(): Option<T> {
    const option = new Option<T>()
    option.some = false
    return option
  }

  /**
   * Returns true if the option wraps a value, or false otherwise.
   */
  public isSome(): boolean {
    return this.some
  }

  /**
   * Returns false if the option does not wrap a value, or false otherwise.
   */
  public isNone(): boolean {
    return !this.some
  }

  /**
   * If both options wrap values, returns the result of strict equality
   * comparison between the two wrapped values. If neither option wraps a value,
   * return true. Otherwise returns false.
   */
  public equals(other: Option<T>): boolean {
    if (this.some && other.some) {
      return this.wrapped === other.wrapped
    }
    return !this.some && !other.some
  }

  /**
   * If both options wrap values, returns the result of weak equality
   * comparison between the two wrapped values. If neither option wraps a value,
   * return true. Otherwise returns false.
   */
  public weakEquals(other: Option<T>): boolean {
    if (this.some && other.some) {
      return this.wrapped == other.wrapped
    }
    return !this.some && !other.some
  }

  /**
   * Returns the wrapped value. Throws an exception if the option does not wrap
   * a value.
   */
  public unwrap(): T {
    if (!this.some) {
      throw new Error(Option.UNWRAP_ERROR)
    }
    return this.wrapped
  }

  /**
   * Returns the wrapped value if the option wraps a value, or returns the
   * provided default value.
   */
  public unwrapOr(def: T): T {
    if (!this.some) {
      return def
    }
    return this.wrapped
  }

  /**
   * A lazy-evaluated version of #unwrapOr.
   *
   * Returns the wrapped value if the option wraps a value, or returns the
   * result of calling the provided function.
   */
  public unwrapOrElse(def: () => T): T {
    if (!this.some) {
      return def()
    }
    return this.wrapped
  }

  /**
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function, wrapped in another option. Otherwise,
   * returns a new none option.
   */
  public map<MappedT>(f: (v: T) => MappedT): Option<MappedT> {
    if (!this.some) {
      return Option.none()
    }
    return Option.some(f(this.wrapped))
  }

  /**
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function. Otherwise, returns the provided default
   * value.
   */
  public mapOr<MappedT>(def: MappedT, f: (v: T) => MappedT): MappedT {
    if (!this.some) {
      return def
    }
    return f(this.wrapped)
  }

  /**
   * A lazy-evaluated version of #mapOr.
   *
   * If the option wraps a value, returns the result of passing the wrapped
   * value to the provided function. Otherwise, returns the result of calling
   * the provided default value function.
   */
  public mapOrElse<MappedT>(def: () => MappedT, f: (v: T) => MappedT): MappedT {
    if (!this.some) {
      return def()
    }
    return f(this.wrapped)
  }
}
