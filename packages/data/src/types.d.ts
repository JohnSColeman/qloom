/** Types for @qloom/data — the runtime for generated API clients (M5). */

export interface DataConfig {
  /** Prefixed to every request path, e.g. "/api". */
  baseUrl?: string;
  /** Override the fetch implementation (tests, SSR, a mock backend). */
  fetch?: typeof fetch;
  /** Extra headers per request, e.g. an auth token. */
  headers?: () => Record<string, string>;
  /** GraphQL endpoint path, prefixed by `baseUrl`. Default "/graphql". */
  graphqlEndpoint?: string;
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  body?: unknown;
}

/** One entry of a GraphQL response `errors` array. */
export interface GraphqlErrorDetail {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}
