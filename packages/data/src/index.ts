/**
 * @qloom/data — the runtime for generated API clients (M5).
 *
 * Zero-dependency: the generated `dal/*` client calls `Data.request()` here,
 * which uses native `fetch`. Nothing but Qloom + generated code ships to the
 * browser. The OpenAPI→TS *generation* is a build-time concern (see
 * @qloom/compiler); this package is only the tiny runtime the generated code
 * depends on.
 */
export type { DataConfig, RequestOptions, GraphqlErrorDetail } from "./types.js";
export { Data } from "./Data.js";
export { ApiError } from "./ApiError.js";
export { Either } from "./Either.js";
export { GraphqlError } from "./GraphqlError.js";
