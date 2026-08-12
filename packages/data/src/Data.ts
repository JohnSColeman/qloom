/**
 * The tiny fetch runtime the generated `dal/*` client calls. Zero-dependency:
 * nothing but Qloom + generated code ships to the browser. Shared mutable
 * config, so a static class (module architecture rule 2).
 */
import { ApiError } from "./ApiError.js";
import { Either } from "./Either.js";
import { GraphqlError } from "./GraphqlError.js";
import type { DataConfig, RequestOptions, GraphqlErrorDetail } from "./types.js";

export class Data {
  private static config: DataConfig = {};

  /** Configure the base URL, fetch implementation, and per-request headers. */
  static configureData(config: DataConfig): void {
    Data.config = { ...Data.config, ...config };
  }

  private static buildUrl(path: string, query?: Record<string, unknown>): string {
    let url = (Data.config.baseUrl ?? "") + path;
    if (query) {
      const pairs: string[] = [];
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
      if (pairs.length) url += (url.includes("?") ? "&" : "?") + pairs.join("&");
    }
    return url;
  }

  /**
   * Issue one request and decode the JSON response. Generated client methods call
   * this; app code calls the generated methods, never this directly.
   */
  static async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const doFetch = Data.config.fetch ?? globalThis.fetch;
    const headers: Record<string, string> = {
      accept: "application/json",
      ...(Data.config.headers?.() ?? {}),
    };
    const init: RequestInit = { method, headers };
    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    const response = await doFetch(Data.buildUrl(path, options.query), init);
    if (!response.ok) {
      // Preserve the server's error detail (JSON body, else raw text) on the error.
      throw new ApiError(method, path, response.status, await Data.readBody(response));
    }
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      // A 2xx whose body isn't the promised JSON (e.g. an HTML error page a proxy
      // served with a 200) — surface it as an ApiError carrying the raw text,
      // not a bare SyntaxError that bypasses the error type.
      throw new ApiError(method, path, response.status, text, "non-JSON response body");
    }
  }

  /** Read a response body best-effort: parsed JSON when it parses, else the raw
   *  text, else undefined (empty body). Never throws. */
  private static async readBody(response: Response): Promise<unknown> {
    let text: string;
    try {
      text = await response.text();
    } catch {
      return undefined;
    }
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Issue one GraphQL operation. Never throws for expected failures: resolves to
   * `Either.right(data)` on success, or `Either.left(GraphqlError)` when the
   * response carries a non-empty `errors` array (partial `data` attached) or the
   * transport fails. Generated GraphQL clients call this.
   */
  static async graphql<T>(
    document: string,
    // `object`, not `Record<string, unknown>`: generated `<Op>Variables` are
    // interfaces, which TS won't assign to an index-signature type. Callers only
    // ever pass a generated variables object (or omit it).
    variables?: object,
  ): Promise<Either<GraphqlError, T>> {
    const doFetch = Data.config.fetch ?? globalThis.fetch;
    const endpoint = (Data.config.baseUrl ?? "") + (Data.config.graphqlEndpoint ?? "/graphql");
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
      ...(Data.config.headers?.() ?? {}),
    };

    let response: Response;
    try {
      response = await doFetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: document, variables }),
      });
    } catch (cause) {
      return Either.left(GraphqlError.transport(0, cause));
    }

    if (!response.ok) {
      return Either.left(GraphqlError.transport(response.status, undefined));
    }

    let body: { data?: T; errors?: GraphqlErrorDetail[] };
    try {
      body = (await response.json()) as { data?: T; errors?: GraphqlErrorDetail[] };
    } catch (cause) {
      return Either.left(GraphqlError.transport(response.status, cause));
    }

    if (body.errors && body.errors.length > 0) {
      return Either.left(GraphqlError.graphql(body.errors, body.data));
    }
    return Either.right(body.data as T);
  }
}
