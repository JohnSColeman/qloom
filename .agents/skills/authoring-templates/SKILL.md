---
name: authoring-templates
description: "Writing Qloom .tml templates — the t: namespace, ${...} expansions, binding prefixes, t:type/t:id, <t:body>, <t:container>, <t:block>, <t:delegate>, <p:...> parameter blocks, and informal parameters. Includes the exact list of what Qloom's compiler supports versus what throws a compile error or is silently degraded. Use when writing or debugging a .tml file."
---

# Authoring `.tml` Templates

A Qloom template is a Tapestry `.tml` file — HTML with `t:`-namespaced elements/attributes and
`${...}` expansions — woven into a page/component class. The compiler (`@qloom/compiler`) parses it
as **XML** and emits a render program. This skill documents the dialect **as Qloom actually
implements it** — which is a subset of Tapestry's, with a few divergences flagged below.

> Port Tapestry templates **byte-for-byte unchanged**. If a real Tapestry template won't render,
> that's a Qloom bug to fix — not a template to edit. This skill tells you what the compiler
> currently handles so you can tell a genuine gap from a mistake.

## XML parsing rules (consequences to know)

- Parsed as **XML, case-sensitively** — `pageTitle` ≠ `pagetitle`. Attribute case is preserved (a fidelity fix; Tapestry parameter names are camelCase).
- Every element must be **well-formed and closed** (`<br/>`, `<input .../>`). Unclosed HTML-style tags break parsing.
- `xmlns:t` / `xmlns:p` namespace declarations are stripped. Comments, doctype, CDATA are ignored.
- The usual template root carries the namespaces:
  ```html
  <html xmlns:t="https://tapestry.apache.org/schema/tapestry_5_4.xsd"
        xmlns:p="tapestry:parameter">
  ```
  **Always declare the `t:` namespace with `https://` and the `tapestry_5_4.xsd` version** — `xmlns:t="https://tapestry.apache.org/schema/tapestry_5_4.xsd"`, not `http://` and not an older version. The namespace URI is stripped at compile time and the `t:` prefix is resolved by name, so either scheme/version parses; standardise on `https://` + `tapestry_5_4` for consistency across templates. Qloom ships this schema (see `@qloom/skills`' bundled `schema/tapestry_5_4.xsd`) so an IDE can resolve it locally.

### Schema version gates (what the compiler enforces)

The compiler reads the `xmlns:t` URI as a **template schema version** (ported from Tapestry's `SaxTemplateParser`) and fails loud on version mismatches:

- **Unrecognized `xmlns:t` URI → compile error.** Only the four Tapestry schema URIs are accepted (`tapestry_5_0_0`, `tapestry_5_1_0`, `tapestry_5_3`, `tapestry_5_4`, either scheme). A typo like `tapestry_5_4.xds` is rejected rather than silently ignored.
- **A `.tml` with no `xmlns:t`** defaults to **5.4**. Override the default with the Vite plugin's `schemaVersion` option (`qloomVitePlugin({ schemaVersion: "5.1" })`) or `compileTemplate(..., { schemaVersion })`. A template that *declares* a recognized `xmlns:t` always wins over the option.
- **`<t:parameter>` is rejected** — deprecated in 5.1 and removed in 5.3 (Tapestry's own error). Use the `p:` (`tapestry:parameter`) informal-block namespace instead.
- **Template-inheritance directives** (`<t:extend>`, `<t:replace>`, `<t:extension-point>`, `<t:content>`, `<t:remove>`) require the 5.1 schema or later in Tapestry; Qloom recognizes them but **does not implement them yet**, so they raise a clear "not yet supported" error rather than compiling to a bogus component.

## `${...}` expansions

Expansions work in **text and attribute values**. Each `${...}` is stringified and concatenated
with surrounding text. Non-nested (stops at the first `}`).

| Form | Resolves to | |
|---|---|---|
| `${property.path}` | `instance.property.path` | ✅ |
| `${user?.fullName}` | safe navigation | ✅ |
| `${prop:foo.bar}` | `instance.foo.bar` (explicit) | ✅ |
| `${message:key}` | message catalogue lookup (`Messages.message`), **locale-aware** | ✅ |
| `${context:/static/x.png}` | the static string `/static/x.png` (prefix stripped) | ✅ |
| `${asset:/path}` | the static string `/path` | ✅ |
| any other prefix (`literal:`, `var:`, …) | — | ❌ **compile error** |

The expression inside `${...}` is Qloom's **full Tapestry property-expression language (PEL)** — at
parity with `tapestry-core`'s grammar, not just dotted paths. Supported:

| Construct | Example | Notes |
|---|---|---|
| Property chain | `hotel.city.name` | dotted navigation |
| Safe navigation | `user?.address?.zip` | short-circuits on null |
| Method call | `label()`, `roles.includes('vip')` | args are themselves PEL expressions |
| Keywords | `null`, `true`, `false`, `this` | `this` is the instance; case-insensitive |
| Literals | `42`, `3.14`, `'text'` | strings in **single** quotes |
| List | `[a, 1, 'x']` | → a JS array |
| Map | `{key: value, 'k': other}` | → a JS `Map`; keys are PEL expressions |
| Range | `1..pageCount` | inclusive integer sequence (asc/desc), iterable |
| Not | `!active` | boolean invert |

There are **no arithmetic or comparison operators** (`+`, `==`, `<`, `&&`) — Tapestry's PEL has none
either. Compute anything comparative/arithmetic in the class and expose it as a getter. Identifiers
resolve to the **exact** TS field name (case-sensitive) — a deliberate divergence from Tapestry's
case-insensitive bean lookup (Qloom reads TS fields directly).

```html
<title>Hotel Booking - ${pageTitle}</title>
<p class="greeting ${mood}">You have ${items.length} items.</p>
<p id="label">${label()}</p>                        <!-- method call -->
<ul><t:loop source="1..pageCount" value="n"><li>${n}</li></t:loop></ul>  <!-- range -->
<img src="${context:/static/logo.png}" />
<p class="empty-result">${message:no-result}</p>
```

**i18n / language switching.** `${message:key}` reads the **active locale**. Static text lives in co-located **`.properties`** files consumed byte-for-byte — `Foo.properties` (default locale), `Foo_fr.properties` (French), plus an app-global `src/app.properties` — consolidated per locale at build time and registered once in `main.ts`:

```ts
import messages from "virtual:qloom/messages";
Messages.registerCatalogues(messages); // "" key = default locale
```

Users switch with the built-in **`<t:localeselector/>`** (a `<select>` of the registered locales, labelled by endonym). `Messages.setLocale(code)` persists the choice to `localStorage` (survives reload) and re-renders the page. A key missing in the active locale falls back to its base language, then the default locale. (`Messages.configureMessages(...)` / `configureLocale(...)` still register JS-defined catalogues.)

## Invoking components

Two syntaxes:

- **Element form** — a `t:`-prefixed tag: `<t:loop>`, `<t:errors/>`, `<t:security.authenticated>` (dots allowed). A bare attribute is a **formal parameter** when its value is a *binding* — valid PEL, an explicit prefix, or a built-in literal-default param; a bare attribute whose value is **not** a binding (e.g. `placeholder="Your name"`, `size="20em"`) is an **informal** attribute, rendered onto the component's root element. `style`/`class` are always informal.
- **Host form** — a normal element carrying `t:type`: `<form t:type="form">`, `<input t:type="textfield">`. Only `t:`-prefixed attributes are formal parameters; the rest are **informal** (applied to the rendered element — see below). Use host form when you want real HTML attributes (`class`, `id`, `type`) on the output.

**Implicit components** — a standard element with a `t:id` but **no** `t:type` maps by tag:
`form→form`, `input→textfield`, `select→select`, `textarea→textfield`, `a→actionlink`. (In practice
most templates write an explicit `t:type`.)

### Reserved `t:` attributes (never parameters)

`t:type` (selects the component), `t:id` (the component id — used for event handler naming and
two-way field binding), and `t:mixins` — **but `t:mixins` is parsed and silently ignored; mixins
are not implemented.**

## Binding prefixes (in `t:` / formal parameter values)

Parameter values are compiled **separately** from `${...}`. Only **two** prefixes are honoured:

| Prefix | Behaviour |
|---|---|
| `prop:` | property path → two-way binding (get + set) |
| `literal:` | the rest of the string, bound verbatim |

How an unprefixed value is resolved:

1. Explicit `prop:` / `literal:` wins.
2. Else if the parameter is in the compiler's **literal-default table** for that built-in (see below) → literal.
3. Else if the value is exactly `true`/`false` → a real **boolean**.
4. Else if it's a bare property path → **`prop`** (two-way).
5. Else → literal string.

```html
<input t:type="textfield" t:id="query" t:value="criteria.query"/>  <!-- prop: two-way -->
<t:radio t:id="smoke" t:value="literal:true"/>                     <!-- literal string "true" -->
<table t:type="grid" t:inPlace="true" .../>                        <!-- real boolean true -->
<a t:type="pagelink" t:page="view" t:context="currentHotel">…</a>  <!-- page=literal, context=prop -->
```

Bindings honour `prop:`, `literal:`, and `message:` (`t:foo="message:x"` looks up the catalogue). An
unprefixed value that isn't a literal-default param (see the table below) is compiled as **full PEL**
(a two-way `prop` conduit when it's an assignable property chain, read-only otherwise) — so method
calls, ranges, etc. work in bindings too. Other prefixes (`context:`/`asset:`/`translate:`/`symbol:`)
are **not** resolved in bindings; `context:`/`asset:` resolve only inside `${...}` expansions.

> ⚠️ **For a formal parameter with a literal value, use `literal:`.** An unprefixed value that *is*
> valid PEL binds as `prop` (two-way). An unprefixed value that is *not* valid PEL (e.g.
> `title="Hello World"`) is treated as an **informal attribute**, not a formal parameter — so if you
> meant to pass it as a formal param, write `title="literal:Hello World"`. Edge case: a bare
> *single identifier* like `autocomplete="off"` looks like PEL, so it binds as a formal `prop`
> (reading `instance.off`) rather than rendering as an attribute — use `autocomplete="literal:off"`
> for a single-word informal value.

### The literal-default table

The compiler can't see app-component parameter descriptors, so it hardcodes which **built-in**
parameters default to `literal`. Anything not listed uses the value-shape heuristic above. The
table (component → literal-default params):

`eventlink`: event, zone · `actionlink`: zone · `pagelink`: page · `zone`: elementName ·
`loop`: element, empty · `layout`: pageTitle, title · `textfield`/`passwordfield`/`textarea`: validate ·
`datefield`: validate, format · `kaptchafield`: image, validate · `radio`: value · `label`: for ·
`beandisplay`/`beaneditform`/`beaneditor`: include, exclude · `grid`: include, add, rowsPerPage ·
`form`: zone · `any`: element · `fontawesomeicon`: icon · `error`: for ·
`propertydisplay`/`propertyeditor`: property · `trigger`: event

So `t:page="search"` binds the literal `"search"`, while `<t:if test="hasItems">` (not in the
table, bare path) two-way-binds `instance.hasItems`.

## Special template tags

| Tag | Behaviour | |
|---|---|---|
| `<t:body/>` | Renders the page/child body at this point. | ✅ |
| `<t:container>…</t:container>` | Transparent wrapper — renders its children, emits no element of its own. Use as a template root when you don't want a wrapper element. | ✅ |
| `<t:block t:id="X">…</t:block>` | A named block. **Renders nothing where it appears**; instead it's hoisted onto the instance as `instance.X` (a render function). Reference it from a `<t:delegate>` or a component parameter. | ✅ |

Using `body`/`container`/`block` as a component `t:type` is a **compile error**.

### `<t:delegate>` — deferred rendering

`Delegate` renders whatever its `to` parameter points at — typically a hoisted block. This is how
Qloom does multi-step / wizard UIs:

```html
<t:block t:id="bookBlock">… the booking form …</t:block>
<t:block t:id="confirmBlock">… the confirmation …</t:block>
<t:delegate to="step"/>   <!-- instance.step returns bookBlock or confirmBlock -->
```

```ts
get step() { return this.confirmationStep ? this.confirmBlock : this.bookBlock; }
```

### `<p:...>` parameter blocks

A child element whose tag starts with `p:` is a **parameter block** passed to the enclosing
component by name. The non-`p:` children form the component's body.

```html
<div t:type="beandisplay" t:object="booking.hotel" t:include="name,city,zip">
  <p:stars><t:hotelclass stars="booking?.hotel?.stars"/></p:stars>
</div>
```

Here `stars` is a block parameter of `beandisplay`. Grid cell overrides use the same mechanism
(`<p:actionCell>`, `<p:cityStateCell>`, `<p:empty>`). A page uses `<p:sidebar>` to fill a `Layout`'s
`sidebar` parameter.

> Tapestry's alternate `<t:parameter name="…">` syntax is **not** recognised — use `<p:name>`.

## Informal (non-`t:`) parameters

Informal parameters are non-formal attributes applied to the component's rendered root element at
runtime — how you put `class`, `id`, `placeholder`, `aria-*`, etc. on a component:

```html
<form t:type="form" class="full-form" id="loginForm" t:id="loginForm" t:zone="result">
```

`class`/`id` are informal (rendered onto the `<form>`); `zone` is a formal parameter.

- **Host form** (`<el t:type>`): every non-`t:`, non-reserved attribute is informal.
- **Element form** (`<t:foo>`): a bare attribute is informal when its value is **not** a binding
  (not valid PEL and no prefix) — so `<t:textfield t:id="x" placeholder="Your name"/>` renders the
  `placeholder`. `style`/`class` are always informal. (The single-identifier caveat above applies.)

The component must render its informals (built-ins that produce an element call `applyInformals`);
a component that emits nothing has nowhere to put them.

## What throws vs. what's silently degraded

**Compile errors (`TemplateCompileError`) — now reported as `Template:line:col: message`:**
- `${...}` with any prefix other than `prop:`/`message:`/`context:`/`asset:` (or none).
- `${...}` or a *formal* binding whose expression is not valid PEL (a stray operator, unterminated string, unbalanced brackets) — a syntax error with the file, line:col, and offending source.
- Using `t:body`/`t:container`/`t:block` as a component `t:type`.

**Build errors (the Vite plugin, checking the `.tml` against its sibling `.ts`):**
- An `on<Event>From<Id>` handler method — or `@OnEvent({ component: "…" })` — that names a `t:id` **not present in this template**. A casing slip (`onSubmitFromLoginform` vs `t:id="loginForm"`) fails the build with a "did you mean…" hint, instead of silently never firing.

Note: method calls, literals, lists, maps, ranges, and `!` are valid PEL (they do not throw); and a
bare non-PEL value on an element-form tag is now an **informal attribute** (see above), not an error.

**Silently ignored / degraded (no error — watch for these):**
- `t:mixins` — dropped (mixins unimplemented).
- A binding value with an unrecognised prefix (`translate:x`, `symbol:x`) — bound as a literal string, prefix not resolved. (`prop:`, `literal:`, and `message:` **are** resolved in bindings; `message:` now looks up the catalogue.)

**Everything else** — app component names, `<t:delegate>`, built-ins — compiles to a
`renderComponent(...)` call resolved at runtime against the registry, so their behaviour lives in
`@qloom/core` / `@qloom/components`, not the compiler.

## Checklist

1. Well-formed XML; every tag closed; correct attribute case (camelCase params).
2. Templates run the full property-expression language (chains, `?.`, method calls, literals, lists, maps, ranges, `!`) — but no arithmetic/comparison; compute those in a getter.
3. Informal HTML attributes work on **both** host form (`<el t:type>`) and element form (`<t:foo>`); use `literal:` for a formal param with a literal value (and for single-word informal values).
4. `${message:...}`/`${context:...}` work in expansions, **not** in parameter bindings.
5. Use `<p:name>` for block parameters, `<t:block t:id>` + `<t:delegate to>` for wizards.
6. Give list rows a `data-key` (`<li data-key="${item.id}">`) when a `Zone` re-render can reorder them, so the reconciler matches by key (preserves focus/input) instead of by position.
7. Name event handlers `on<Event>From<Id>` matching a real `t:id` — a mismatch fails the build.
8. When a real Tapestry template won't render, check this list before touching the `.tml` — then fix the framework, not the template.
