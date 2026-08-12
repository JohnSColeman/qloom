/**
 * The `Left` value a generated GraphQL operation resolves to on failure. Unifies
 * GraphQL's two failure modes: a 200 response whose `errors` array is non-empty
 * (`kind: "graphql"`, carrying any partial `data`), and a network / non-2xx /
 * unparseable response (`kind: "transport"`). Zero-dependency, browser-safe.
 */
import type { GraphqlErrorDetail } from "./types.js";

export class GraphqlError extends Error {
  override name = "GraphqlError";
  readonly kind: "graphql" | "transport";
  readonly errors?: GraphqlErrorDetail[];
  readonly partialData?: unknown;
  readonly status?: number;
  override cause?: unknown;

  private constructor(init: {
    kind: "graphql" | "transport";
    message: string;
    errors?: GraphqlErrorDetail[];
    partialData?: unknown;
    status?: number;
    cause?: unknown;
  }) {
    super(init.message);
    this.kind = init.kind;
    if (init.errors !== undefined) this.errors = init.errors;
    if (init.partialData !== undefined) this.partialData = init.partialData;
    if (init.status !== undefined) this.status = init.status;
    if (init.cause !== undefined) this.cause = init.cause;
  }

  /** HTTP 200 but the response `errors` array is non-empty. */
  static graphql(errors: GraphqlErrorDetail[], partialData: unknown): GraphqlError {
    const message = errors.map((e) => e.message).join("; ") || "qloom: GraphQL error";
    return new GraphqlError({ kind: "graphql", message, errors, partialData });
  }

  /** Network failure, non-2xx HTTP, or an unparseable response. */
  static transport(status: number, cause: unknown): GraphqlError {
    return new GraphqlError({
      kind: "transport",
      message: `qloom: GraphQL transport error (${status})`,
      status,
      cause,
    });
  }
}
