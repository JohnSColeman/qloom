/** Thrown on a non-2xx response, or when a 2xx response body is not the JSON the
 *  contract promised. Carries the response `body` (parsed JSON when the response
 *  was JSON, else the raw text, else undefined) so the app can surface the
 *  server's own error detail instead of a bare status. */
export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    readonly method: string,
    readonly path: string,
    readonly status: number,
    readonly body?: unknown,
    note?: string,
  ) {
    super(
      `qloom: ${method} ${path} → ${status}` + (note ? ` (${note})` : "") + ApiError.hint(body),
    );
  }

  private static hint(body: unknown): string {
    const message = ApiError.messageOf(body);
    if (!message) return "";
    const trimmed = message.length > 200 ? `${message.slice(0, 200)}…` : message;
    return `: ${trimmed}`;
  }

  /** Best-effort human message from an error body: a JSON object's
   *  `message`/`error`/`detail`/`title`, or a non-empty raw string. */
  static messageOf(body: unknown): string | undefined {
    if (body == null) return undefined;
    if (typeof body === "string") return body || undefined;
    if (typeof body === "object") {
      const record = body as Record<string, unknown>;
      for (const key of ["message", "error", "detail", "title"]) {
        const value = record[key];
        if (typeof value === "string" && value) return value;
      }
    }
    return undefined;
  }
}
