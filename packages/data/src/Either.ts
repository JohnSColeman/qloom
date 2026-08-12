/**
 * A functional either/result. `Right` is success, `Left` is failure. Generated
 * GraphQL clients return `Either<GraphqlError, T>`; callers `.fold` over the two
 * outcomes instead of try/catch. Zero-dependency, browser-safe.
 */
export class Either<L, R> {
  private constructor(
    private readonly _tag: "left" | "right",
    private readonly _left?: L,
    private readonly _right?: R,
  ) {}

  static left<L, R>(value: L): Either<L, R> {
    return new Either<L, R>("left", value, undefined);
  }

  static right<L, R>(value: R): Either<L, R> {
    return new Either<L, R>("right", undefined, value);
  }

  get isLeft(): boolean {
    return this._tag === "left";
  }

  get isRight(): boolean {
    return this._tag === "right";
  }

  fold<T>(onLeft: (l: L) => T, onRight: (r: R) => T): T {
    return this._tag === "left" ? onLeft(this._left as L) : onRight(this._right as R);
  }

  map<R2>(fn: (r: R) => R2): Either<L, R2> {
    return this._tag === "right"
      ? Either.right<L, R2>(fn(this._right as R))
      : Either.left<L, R2>(this._left as L);
  }

  mapLeft<L2>(fn: (l: L) => L2): Either<L2, R> {
    return this._tag === "left"
      ? Either.left<L2, R>(fn(this._left as L))
      : Either.right<L2, R>(this._right as R);
  }

  flatMap<R2>(fn: (r: R) => Either<L, R2>): Either<L, R2> {
    return this._tag === "right" ? fn(this._right as R) : Either.left<L, R2>(this._left as L);
  }

  getOrElse(fallback: R): R {
    return this._tag === "right" ? (this._right as R) : fallback;
  }
}
