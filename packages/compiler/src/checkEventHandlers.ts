/** Uppercase the first character (the runtime's `cap`, used to build handler names). */
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** All `on…` method-name tokens in the source, comment-stripped. */
const ON_METHOD = /\bon[A-Z][A-Za-z0-9_]*\b/g;

/** An `@OnEvent({ … })` decorator's options-object body. */
const ON_EVENT = /@OnEvent\s*\(\s*\{([\s\S]*?)\}\s*\)/g;

/** A string-literal `component: "id"` within an options object. */
const COMPONENT_PROP = /\bcomponent\s*:\s*["']([^"']+)["']/;

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

/** True if `method` resolves to some id under the runtime rule
 *  `on{cap(event)}From{cap(id)}` (a non-empty, capitalised event + a real id). */
function resolves(method: string, ids: readonly string[]): boolean {
  for (const id of ids) {
    const suffix = `From${cap(id)}`;
    if (method.endsWith(suffix) && /^on[A-Z]/.test(method.slice(0, method.length - suffix.length))) {
      return true;
    }
  }
  return false;
}

/** A "did you mean" correction when only the *casing* of the id is wrong. */
function suggestion(method: string, ids: readonly string[]): { id: string; corrected: string } | undefined {
  const lower = method.toLowerCase();
  for (const id of ids) {
    const tail = `from${id.toLowerCase()}`;
    if (lower.endsWith(tail) && lower.length > tail.length) {
      const prefix = method.slice(0, method.length - tail.length); // the original "onEvent"
      if (/^on[A-Z]/.test(prefix)) return { id, corrected: `${prefix}From${cap(id)}` };
    }
  }
  return undefined;
}

/**
 * Compile-time guard for Qloom's two event-handler binding styles:
 *  - the `on<Event>From<Id>` naming convention — matching mirrors `triggerEvent`'s
 *    `on{cap(event)}From{cap(id)}` resolution exactly (case-SENSITIVE, since it is
 *    a method-name lookup), so capitalised ids (`RegisterForm`) and ids containing
 *    "From" resolve correctly, and a casing slip is reported with a did-you-mean;
 *  - `@OnEvent({ component: "id" })` — matching is case-INSENSITIVE, mirroring the
 *    runtime's `component.toLowerCase() === id.toLowerCase()`, so only a truly
 *    absent component is flagged.
 *
 * Each returned string is an error for a handler/decorator that references no
 * `t:id` in the paired template — the silent misfire this catches. Pure and
 * side-effect-free; the Vite plugin runs it and fails the build.
 */
export function checkEventHandlers(
  className: string,
  source: string,
  ids: readonly string[],
): string[] {
  const errors: string[] = [];
  const clean = stripComments(source);
  const present = ids.length ? ids.map((id) => `"${id}"`).join(", ") : "(none)";

  // Naming convention: on<Event>From<Id> (case-sensitive method-name resolution).
  for (const method of new Set(clean.match(ON_METHOD) ?? [])) {
    if (!/From[A-Z]/.test(method)) continue; // only the From<Id> form has a checkable source
    if (resolves(method, ids)) continue;
    const hint = suggestion(method, ids);
    errors.push(
      hint
        ? `${className}: event handler "${method}" will never fire — did you mean "${hint.corrected}"? ` +
            `The component id is "${hint.id}" (check casing) in ${className}.tml.`
        : `${className}: event handler "${method}" references a component that does not exist in ` +
            `${className}.tml. Declared t:id components: ${present}.`,
    );
  }

  // @OnEvent({ component: "id" }) — explicit, case-insensitive component match.
  const idsLower = new Set(ids.map((id) => id.toLowerCase()));
  for (const match of clean.matchAll(ON_EVENT)) {
    const comp = COMPONENT_PROP.exec(match[1] ?? "")?.[1];
    if (comp === undefined || idsLower.has(comp.toLowerCase())) continue;
    errors.push(
      `${className}: @OnEvent({ component: "${comp}" }) references a component that does not exist in ` +
        `${className}.tml. Declared t:id components: ${present}.`,
    );
  }

  return errors;
}
