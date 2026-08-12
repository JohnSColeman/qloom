/**
 * Offline `.tml` → render-program compiler.
 *
 * Emits an ES module:  export default function render(instance, writer, body) { … }
 * using @qloom/core's MarkupWriter. Components compile to `renderComponent(...)`
 * calls; `<t:body/>` compiles to `body(writer)`.
 *
 * `.tml` is XML (case-sensitive — `pageTitle`, not `pagetitle`), so we parse in
 * XML mode via htmlparser2.
 *
 * Supported:
 *   - `${…}` expansions and `t:param` bindings run the full Tapestry property-
 *     expression language (PEL): property chains + safe navigation (`user?.fullName`),
 *     method calls (`label()`), literals, `[…]` lists, `{…}` maps, `a..b` ranges, `!`
 *   - `${prefix:…}` expansions: `context:`/`asset:` → the static path (M2),
 *     `message:` → the message catalogue, `prop:`/no prefix → full PEL
 *   - components: `<t:foo p="expr">…</t:foo>` and host form `<el t:type="foo" t:p="expr">`
 *   - parameter bindings resolve in order: an explicit `prop:`/`literal:`/`message:`
 *     prefix; else a built-in literal-default param (`LITERAL_PARAMS`); else full
 *     PEL (`prop:`, two-way for property chains)
 *   - `<t:body/>`, transparent `<t:container>`
 *
 * Loop variables are container properties (Tapestry-faithful), so there is no
 * local scope — every path is on `instance`.
 */
import { parseDocument } from "htmlparser2";
import { TemplateCompileError } from "./TemplateCompileError.js";
import { parseExpression } from "./expr/parseExpression.js";
import { emitExpression } from "./expr/emitExpression.js";
import { emitConduit } from "./expr/emitConduit.js";
import type { CompileOptions, CompileResult, SchemaVersion } from "./types.js";

interface Node {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: Node[];
  startIndex?: number | null;
}

const INTERP = /\$\{([^}]*)\}/g;
const PREFIX = /^([a-z]+):([\s\S]*)$/;

const SPECIAL_TAGS = new Set(["t:body", "t:container", "t:block"]);
const NON_PARAM_ATTRS = new Set(["t:type", "t:id", "t:mixins"]);

// --- Tapestry template schema versions (ported from SaxTemplateParser) ---------
// The `xmlns:t` URI selects a template version; the version gates which `t:`
// directives are legal. Versions are compared as major*10+minor. Tapestry
// registers only the `http://` URIs; Qloom standardises on `https://` and accepts
// both. The schema *file* is only an IDE aid — never loaded — so we recognise the
// URI by its `tapestry_x_y[_z].xsd` basename.
const SCHEMA_FILE_TO_VERSION: Record<string, number> = {
  "tapestry_5_0_0.xsd": 50,
  "tapestry_5_1_0.xsd": 51,
  "tapestry_5_3.xsd": 53,
  "tapestry_5_4.xsd": 54,
};
const OPTION_TO_VERSION: Record<SchemaVersion, number> = {
  "5.0": 50,
  "5.1": 51,
  "5.3": 53,
  "5.4": 54,
};
const V5_1 = 51;
const V5_3 = 53;
/** Tapestry 5.1+ template-inheritance / trimming directives (element-form `t:` tags). */
const INHERITANCE_DIRECTIVES = new Set(["extend", "replace", "extension-point", "content", "remove"]);
/** Human label for a version number, matching the schema filename stem. */
function versionLabel(v: number): string {
  return v === 50 ? "tapestry_5_0_0" : v === 51 ? "tapestry_5_1_0" : v === 53 ? "tapestry_5_3" : "tapestry_5_4";
}

/** `style`/`class` are virtually never declared `@Parameter`s in real Tapestry
 *  components — they're catch-all informal (presentation) attributes. The
 *  compiler has no reflection into a component's formal parameter list (see
 *  `LITERAL_PARAMS` below), so on an element-form tag (`<t:foo style="…">`)
 *  it would otherwise try to compile the attribute value as a PEL expression.
 *  Route these two through `informals` unconditionally, on both host-form and
 *  element-form tags — matching how `applyInformals` renders them at runtime. */
const ALWAYS_INFORMAL_ATTRS = new Set(["style", "class"]);

/** Standard elements that become a component when given a `t:id` (no `t:type`). */
const IMPLICIT_COMPONENTS: Record<string, string> = {
  form: "form",
  input: "textfield",
  select: "select",
  textarea: "textfield",
  a: "actionlink",
};

/**
 * Built-in components whose parameters default to the LITERAL prefix (in
 * Tapestry these declare `defaultPrefix = LITERAL`). Until parameter descriptors
 * are shared with the compiler, this table keeps the built-ins faithful; app
 * components fall back to the value-shape heuristic or explicit prefixes.
 */
const LITERAL_PARAMS: Record<string, Set<string>> = {
  eventlink: new Set(["event", "zone"]),
  actionlink: new Set(["zone"]),
  pagelink: new Set(["page"]),
  zone: new Set(["elementName"]),
  loop: new Set(["element", "empty"]),
  layout: new Set(["pageTitle", "title"]),
  textfield: new Set(["validate"]),
  submit: new Set(["mode"]),
  passwordfield: new Set(["validate"]),
  datefield: new Set(["validate", "format"]),
  kaptchafield: new Set(["image", "validate"]),
  radio: new Set(["value"]),
  label: new Set(["for"]),
  beandisplay: new Set(["include", "exclude"]),
  grid: new Set(["include", "add", "rowsPerPage"]),
  form: new Set(["zone"]),
  any: new Set(["element"]),
  textarea: new Set(["validate"]),
  fontawesomeicon: new Set(["icon"]),
  error: new Set(["for"]),
  propertydisplay: new Set(["property"]),
  propertyeditor: new Set(["property"]),
  beaneditform: new Set(["include", "exclude"]),
  beaneditor: new Set(["include", "exclude"]),
  trigger: new Set(["event"]),
};

/** Throw a compile error located at the node currently being emitted
 *  (`ctx.pos`), formatted as `name:line:col: message`. */
function fail(ctx: Ctx, message: string): never {
  let line = 1;
  let column = 1;
  const end = Math.min(ctx.pos, ctx.source.length);
  for (let i = 0; i < end; i++) {
    if (ctx.source[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  throw new TemplateCompileError(`${ctx.name}:${line}:${column}: ${message}`, line, column);
}

/** Compile a PEL source into a JS value expression (for `${…}`). */
function compilePelValue(src: string, ctx: Ctx): string {
  try {
    return emitExpression(parseExpression(src), ctx.used);
  } catch (e) {
    fail(ctx, `${(e as Error).message} in "${src}"`);
  }
}

/** Compile a PEL source into a `{ get, set? }` binding (for `t:param`). */
function compilePelConduit(src: string, ctx: Ctx): string {
  try {
    return emitConduit(parseExpression(src), ctx.used);
  } catch (e) {
    fail(ctx, `${(e as Error).message} in "${src}"`);
  }
}

/** Compile one `${…}` expression: a `context:`/`asset:` path becomes a static
 *  string; `message:` resolves via the message catalogue; `prop:`/no prefix is
 *  full PEL. */
function compileExpansion(inner: string, ctx: Ctx): string {
  const trimmed = inner.trim();
  const m = PREFIX.exec(trimmed);
  if (m) {
    const [, prefix, rest] = m;
    if (prefix === "context" || prefix === "asset") {
      // Resolve at render time against the configured context root, so assets
      // work under a sub-path deployment (e.g. a GitHub Pages project site).
      // Default context root "" leaves the path unchanged (root-mounted apps).
      ctx.used.add("Assets");
      return `Assets.contextPath(${JSON.stringify(rest!.trim())})`;
    }
    if (prefix === "message") {
      ctx.usesMessage = true;
      return `Messages.message(${JSON.stringify(rest!.trim())})`;
    }
    if (prefix === "prop") return compilePelValue(rest!.trim(), ctx);
    fail(ctx, `unsupported expansion prefix "${prefix}:" in "${inner}".`);
  }
  return compilePelValue(trimmed, ctx);
}

function hasInterpolation(text: string): boolean {
  return /\$\{[^}]*\}/.test(text);
}

/** Turn a string containing `${…}` into a JS expression producing a string. */
function compileInterpolation(text: string, ctx: Ctx): string {
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INTERP.lastIndex = 0;
  while ((m = INTERP.exec(text)) !== null) {
    if (m.index > last) parts.push(JSON.stringify(text.slice(last, m.index)));
    parts.push(`String(${compileExpansion(m[1] ?? "", ctx)})`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(JSON.stringify(text.slice(last)));
  return parts.length === 0 ? '""' : parts.join(" + ");
}

/** Compile a component parameter value into a `{ get, set? }` binding literal.
 *  Explicit `prop:`/`literal:`/`message:` win; then a built-in literal-default
 *  param; else the `prop` default — full PEL, two-way for property chains. */
function compileBinding(type: string, param: string, expr: string, ctx: Ctx): string {
  const trimmed = expr.trim();
  const m = PREFIX.exec(trimmed);
  if (m && (m[1] === "prop" || m[1] === "literal" || m[1] === "message")) {
    const rest = m[2]!.trim();
    if (m[1] === "literal") return `{ get: () => ${JSON.stringify(rest)} }`;
    if (m[1] === "message") {
      ctx.usesMessage = true;
      return `{ get: () => Messages.message(${JSON.stringify(rest)}) }`;
    }
    return compilePelConduit(rest, ctx); // prop:
  }
  if (LITERAL_PARAMS[type.toLowerCase()]?.has(param)) {
    return `{ get: () => ${JSON.stringify(trimmed)} }`;
  }
  // A bare single identifier is ambiguous — `prop:<id>` or `literal:<id>` — and
  // is resolved at render time against the child component's declared
  // `@Parameter({ defaultPrefix })` (default prop). Complex expressions (paths,
  // calls, operators) and the prop keywords are unambiguously prop.
  if (isBareIdentifier(trimmed)) {
    ctx.used.add("resolveDefaultPrefix");
    return `resolveDefaultPrefix(${JSON.stringify(type)}, ${JSON.stringify(param)}, ${compilePelConduit(trimmed, ctx)}, ${JSON.stringify(trimmed)})`;
  }
  return compilePelConduit(trimmed, ctx); // default prefix: prop
}

/** The prop-expression keywords — never treated as a defaultPrefix literal. */
const PEL_KEYWORDS = new Set(["true", "false", "null", "this"]);

/** A bare single identifier (the only prefix-ambiguous form): `foo`, not
 *  `foo.bar`, `f()`, `!x`, or a keyword. */
function isBareIdentifier(src: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(src) && !PEL_KEYWORDS.has(src);
}

interface Ctx {
  name: string;
  source: string; // full template text, for line:col in errors
  pos: number; // start index of the node currently being emitted
  lines: string[];
  usesComponent: boolean;
  usesMessage: boolean;
  used: Set<string>; // runtime helpers referenced by emitted expressions (e.g. "pelRange")
  blockN: number;
  version: number; // resolved Tapestry template schema version (major*10+minor)
}

function isElement(node: Node): boolean {
  return node.type === "tag" || node.type === "script" || node.type === "style";
}

/** Can this attribute value be a property/expression binding (valid PEL)? */
function parsesAsPel(src: string): boolean {
  try {
    parseExpression(src);
    return true;
  } catch {
    return false;
  }
}

/**
 * Classify a component-tag attribute as a formal parameter, an informal
 * (pass-through) attribute, or skipped. The compiler has no formal-parameter
 * descriptors, so on an element-form tag (`<t:foo>`) it infers: `t:`-prefixed
 * and known-literal (`LITERAL_PARAMS`) params are formal; a bare attribute is
 * formal only when its value is a *binding* — an explicit prefix or valid PEL —
 * otherwise it is an informal literal attribute (e.g. `placeholder="Your name"`,
 * `size="20em"`), which previously threw when force-compiled as PEL. On a
 * host-form tag (`<input t:type="…">`), `t:` attributes are formal and every
 * other attribute is informal. `style`/`class` are always informal.
 *
 * Limitation (no descriptors): a bare value that is a single valid identifier
 * (e.g. `autocomplete="off"`) is indistinguishable from a formal prop binding
 * and is treated as formal. For such an informal HTML attribute, use a
 * `literal:` prefix (`autocomplete="literal:off"`) or the host-form of the
 * component. Multi-token / punctuated values (`"Your name"`, `"20em"`) are
 * unambiguous and route to informal automatically.
 */
function classifyAttr(
  aname: string,
  avalue: string,
  elementForm: boolean,
  type: string,
): "formal" | "informal" | "skip" {
  if (NON_PARAM_ATTRS.has(aname) || aname.startsWith("xmlns")) return "skip";
  if (ALWAYS_INFORMAL_ATTRS.has(aname)) return "informal";
  if (!elementForm) return aname.startsWith("t:") ? "formal" : "informal";
  if (aname.startsWith("t:")) return "formal";
  if (LITERAL_PARAMS[type.toLowerCase()]?.has(aname)) return "formal";
  const trimmed = avalue.trim();
  if (PREFIX.test(trimmed)) return "formal"; // explicit prefix → compileBinding
  if (hasInterpolation(avalue)) return "informal"; // ${…} → interpolated attribute
  return parsesAsPel(trimmed) ? "formal" : "informal";
}

/** Formal-parameter bindings from a component's attributes. */
function paramEntryList(node: Node, type: string, elementForm: boolean, ctx: Ctx): string[] {
  const entries: string[] = [];
  for (const [aname, avalue] of Object.entries(node.attribs ?? {})) {
    if (classifyAttr(aname, avalue, elementForm, type) !== "formal") continue;
    const pname = aname.startsWith("t:") ? aname.slice(2) : aname;
    entries.push(`${JSON.stringify(pname)}: ${compileBinding(type, pname, avalue, ctx)}`);
  }
  return entries;
}

/** Informal (pass-through) attributes — rendered onto the component's root
 *  element via `applyInformals`. See `classifyAttr` for the formal/informal
 *  split. */
function informalEntries(node: Node, type: string, elementForm: boolean, ctx: Ctx): string {
  const entries: string[] = [];
  for (const [aname, avalue] of Object.entries(node.attribs ?? {})) {
    if (classifyAttr(aname, avalue, elementForm, type) !== "informal") continue;
    const value = hasInterpolation(avalue) ? compileInterpolation(avalue, ctx) : JSON.stringify(avalue);
    entries.push(`${JSON.stringify(aname)}: ${value}`);
  }
  return entries.length ? ` ${entries.join(", ")} ` : "";
}

/** Find the first element carrying an `xmlns:t` declaration (conventionally the root). */
function findTemplateNamespace(nodes: readonly Node[]): { uri: string; node: Node } | undefined {
  for (const node of nodes) {
    const uri = isElement(node) ? node.attribs?.["xmlns:t"] : undefined;
    if (uri) return { uri, node };
    const nested = node.children ? findTemplateNamespace(node.children) : undefined;
    if (nested) return nested;
  }
  return undefined;
}

/**
 * Resolve the template's Tapestry schema version. A declared, recognized `xmlns:t`
 * URI wins; an unrecognized Tapestry-namespaced URI fails loud (typo/wrong schema);
 * a missing declaration falls back to the configured default. Ported from
 * SaxTemplateParser's `NAMESPACE_URI_TO_VERSION` recognition gate.
 */
function resolveTemplateVersion(ctx: Ctx, roots: readonly Node[], configured: number): number {
  const declared = findTemplateNamespace(roots);
  if (!declared) return configured;
  const file = declared.uri.replace(/^https?:\/\/tapestry\.apache\.org\/schema\//, "");
  const version = SCHEMA_FILE_TO_VERSION[file];
  if (version === undefined) {
    if (typeof declared.node.startIndex === "number") ctx.pos = declared.node.startIndex;
    fail(
      ctx,
      `unrecognized Tapestry schema namespace "${declared.uri}". Use one of ${Object.keys(
        SCHEMA_FILE_TO_VERSION,
      )
        .map((f) => `https://tapestry.apache.org/schema/${f}`)
        .join(", ")}.`,
    );
  }
  return version;
}

/**
 * Reject a `t:` directive that isn't legal at the template's schema version, and
 * the directives Qloom doesn't implement — mirroring SaxTemplateParser's per-version
 * gates. `tag` is the raw element name (e.g. `t:remove`); only element-form `t:`
 * tags reach here. No-op for tags that aren't version-gated directives.
 */
function checkDirectiveVersion(ctx: Ctx, tag: string): void {
  if (!tag.startsWith("t:")) return;
  const name = tag.slice(2);

  if (name === "parameter") {
    // Deprecated in 5.1, removed in 5.3 (Tapestry throws at >=5.3). Qloom has never
    // implemented the classic <parameter>; below 5.3 it's simply unsupported.
    if (ctx.version >= V5_3) {
      fail(
        ctx,
        "The <parameter> element has been deprecated in Tapestry 5.3 in favour of 'tapestry:parameter' namespace.",
      );
    }
    fail(ctx, "Qloom does not support the classic <parameter> element; use the p: (tapestry:parameter) namespace.");
  }

  if (INHERITANCE_DIRECTIVES.has(name)) {
    if (ctx.version < V5_1) {
      fail(
        ctx,
        `<t:${name}> requires the tapestry_5_1_0 schema (or later), but the template declares ${versionLabel(
          ctx.version,
        )}.`,
      );
    }
    fail(ctx, `Qloom does not yet support the <t:${name}> template-inheritance directive.`);
  }
}

function emitChildren(nodes: readonly Node[], ctx: Ctx): void {
  for (const node of nodes) emitNode(node, ctx);
}

/** Recursively gather named `<t:block t:id="X">` nodes for hoisting. */
function collectBlocks(
  nodes: readonly Node[],
  out: Array<{ id: string; node: Node }> = [],
): Array<{ id: string; node: Node }> {
  for (const node of nodes) {
    if (isElement(node) && node.name === "t:block") {
      const id = node.attribs?.["t:id"];
      if (id) out.push({ id, node });
    }
    if (node.children) collectBlocks(node.children, out);
  }
  return out;
}

function emitNode(node: Node, ctx: Ctx): void {
  if (typeof node.startIndex === "number") ctx.pos = node.startIndex; // locate errors at this node
  if (node.type === "text") {
    ctx.lines.push(`writer.text(${compileInterpolation(node.data ?? "", ctx)});`);
    return;
  }
  if (node.type !== "tag" && node.type !== "script" && node.type !== "style") {
    return; // comment, directive (doctype), cdata
  }

  const tag = node.name ?? "";

  if (tag === "t:body") {
    ctx.lines.push(`if (body) body(writer);`);
    return;
  }
  if (tag === "t:container") {
    emitChildren(node.children ?? [], ctx);
    return;
  }
  if (tag === "t:block") {
    // Named blocks are hoisted to instance fields (see compileTemplate); a block
    // renders nothing where it appears — only when delegated to (`<t:delegate>`).
    return;
  }

  checkDirectiveVersion(ctx, tag); // version-gated t: directives (throws) — else falls through

  const elementForm = tag.startsWith("t:");
  let type = elementForm ? tag.slice(2) : node.attribs?.["t:type"];
  // Implicit component: a standard element with a `t:id` but no `t:type` becomes
  // the component its tag maps to (Tapestry: `<form t:id="…">` → Form, etc.).
  if (!type && !elementForm && node.attribs?.["t:id"]) {
    type = IMPLICIT_COMPONENTS[tag.toLowerCase()];
  }

  if (type) {
    if (SPECIAL_TAGS.has(`t:${type}`)) {
      fail(ctx, `reserved tag t:${type} cannot be a component.`);
    }
    ctx.usesComponent = true;

    // Partition children: <p:foo> elements are parameter blocks (each compiled
    // to a RenderBody bound to param `foo`); the rest form the component body.
    const bodyChildren: Node[] = [];
    const blockEntries: string[] = [];
    for (const child of node.children ?? []) {
      const cname = child.name ?? "";
      if (isElement(child) && cname.startsWith("p:")) {
        const param = cname.slice(2);
        const varName = `$block${ctx.blockN++}`;
        ctx.lines.push(`const ${varName} = (writer) => {`);
        emitChildren(child.children ?? [], ctx);
        ctx.lines.push(`};`);
        blockEntries.push(`${JSON.stringify(param)}: { get: () => ${varName} }`);
      } else {
        bodyChildren.push(child);
      }
    }

    const entries = [...paramEntryList(node, type, elementForm, ctx), ...blockEntries];
    const bindings = entries.length ? ` ${entries.join(", ")} ` : "";
    const informals = informalEntries(node, type, elementForm, ctx);
    const id = node.attribs?.["t:id"];
    const idArg = id ? JSON.stringify(id) : "undefined";
    // t:mixins="a,b" — a comma list of mixin ids attached to this component;
    // resolved from the registry and interleaved at render time (Tapestry mixins).
    const mixinAttr = node.attribs?.["t:mixins"];
    const mixinList = mixinAttr
      ? mixinAttr.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean)
      : [];
    const mixinsArg = mixinList.length ? `, [${mixinList.map((m) => JSON.stringify(m)).join(", ")}]` : "";
    ctx.lines.push(
      `renderComponent(${JSON.stringify(type)}, instance, ${idArg}, {${bindings}}, {${informals}}, writer, function (writer) {`,
    );
    emitChildren(bodyChildren, ctx);
    ctx.lines.push(`}${mixinsArg});`);
    return;
  }

  // plain element
  ctx.lines.push(`writer.element(${JSON.stringify(tag)});`);
  for (const [aname, avalue] of Object.entries(node.attribs ?? {})) {
    if (aname.startsWith("t:")) continue;
    const value = hasInterpolation(avalue)
      ? compileInterpolation(avalue, ctx)
      : JSON.stringify(avalue);
    ctx.lines.push(`writer.attribute(${JSON.stringify(aname)}, ${value});`);
  }
  emitChildren(node.children ?? [], ctx);
  ctx.lines.push(`writer.end();`);
}

/** Compile a `.tml` template into render-program module source. */
export function compileTemplate(html: string, options: CompileOptions): CompileResult {
  const doc = parseDocument(html, {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    withStartIndices: true,
    withEndIndices: true,
  }) as unknown as { children: Node[] };

  const configured = OPTION_TO_VERSION[options.schemaVersion ?? "5.4"];
  if (configured === undefined) {
    throw new TemplateCompileError(
      `${options.name}: invalid schemaVersion "${options.schemaVersion}". Use one of ${Object.keys(
        OPTION_TO_VERSION,
      ).join(", ")}.`,
    );
  }

  const ctx: Ctx = {
    name: options.name,
    source: html,
    pos: 0,
    lines: [],
    usesComponent: false,
    usesMessage: false,
    used: new Set(),
    blockN: 0,
    version: configured,
  };

  ctx.version = resolveTemplateVersion(ctx, doc.children, configured);

  // Hoist named `<t:block t:id="X">` definitions to instance fields, so
  // `<t:delegate to="X">` (or a getter returning `this.X`) can render them.
  // Tapestry injects blocks as fields; a block never renders where it appears.
  for (const b of collectBlocks(doc.children)) {
    ctx.lines.push(`instance[${JSON.stringify(b.id)}] = (writer) => {`);
    emitChildren(b.node.children ?? [], ctx);
    ctx.lines.push(`};`);
  }

  emitChildren(doc.children, ctx);

  const body = ctx.lines.map((line) => "  " + line).join("\n");
  const coreImports: string[] = [];
  if (ctx.usesComponent) coreImports.push("renderComponent");
  if (ctx.usesMessage) coreImports.push("Messages");
  if (ctx.used.has("Assets")) coreImports.push("Assets");
  if (ctx.used.has("pelRange")) coreImports.push("pelRange");
  if (ctx.used.has("resolveDefaultPrefix")) coreImports.push("resolveDefaultPrefix");
  const header = coreImports.length ? `import { ${coreImports.join(", ")} } from "@qloom/core";\n\n` : "";
  const code = [
    `${header}// Qloom render program — compiled from "${options.name}.tml". Do not edit.`,
    `export default function render(instance, writer, body) {`,
    body,
    `}`,
    ``,
  ].join("\n");

  return { code, diagnostics: [`compiled ${ctx.lines.length} ops for ${options.name}.tml`] };
}
