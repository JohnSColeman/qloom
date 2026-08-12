---
name: forms-and-validation
description: "Building forms in Qloom — the Form component, field components and two-way binding, the validate spec (required/minlength/maxlength/email), cross-field validation in the submit handler, the Errors display, and the submit → validate → Post-Redirect-Get flow (plus Ajax forms that refresh a Zone). Use when creating or debugging a form."
---

# Forms and Validation

A Qloom form is a `Form` component wrapping field components. On submit the Form pulls every field's
value back to its bound property (two-way), validates each field, and — if clean — fires the `submit`
event; your handler's return value drives navigation (Post-Redirect-Get). This mirrors Tapestry's
form flow minus the server round-trip.

## The shape of a form

```html
<!-- Signin.tml -->
<form t:type="form" class="full-form" t:id="loginForm">
  <t:errors/>
  <label t:type="label" t:for="username">username:</label>
  <input t:type="textfield" t:id="username" t:validate="required"/>
  <label t:type="label" t:for="password">password:</label>
  <input type="password" t:type="passwordfield" t:id="password" t:validate="required"/>
  <input type="submit" value="Login"/>
</form>
```

```ts
export class Signin extends Page {
  @Property username = "";
  @Property password = "";

  async onSubmitFromLoginForm(): Promise<unknown> {
    try { await auth.login(this.username, this.password); return "index"; }  // PRG navigate
    catch (e) { return e instanceof Error ? e.message : "Login failed"; }    // error via <t:errors/>
  }
}
```

## Two-way binding — fields fill your properties

A field's value binds two ways. The key convenience: **when you don't write `t:value`, the field binds
the container property named by its `t:id`.** So `<input t:type="textfield" t:id="username"/>` fills
`this.username`. Bind explicitly with `t:value` when the property name differs or is nested:

```html
<input t:type="textfield" t:id="query" t:value="criteria.query"/>   <!-- → this.criteria.query -->
```

The property must be a `@Property` (or a bound `@Parameter`). See `using-components` for each field.

## Editing a table of rows — a loop of fields in a form

To edit many rows of a collection at once, put a `<t:loop>` of fields inside the `<t:form>` and bind each
field to a property of the loop value. On submit, **every row's edit round-trips to its own item** — Qloom
re-establishes each row before pulling its fields, so nothing clobbers:

```html
<form t:type="form" t:id="form">
  <t:loop t:source="rows" t:value="row">
    <input t:type="textfield" t:value="row.name"/>
    <input t:type="textfield" t:value="row.qty"/>
  </t:loop>
  <input type="submit" value="Save"/>
</form>
```
```ts
@Property rows: Row[] = [...];   // a collection of objects
@Property row!: Row;             // the loop value
onSuccessFromForm() { /* this.rows now holds every edit */ }
```

- **Use an object collection** (`{ name, qty }`), not primitives (`string[]`). Editing a primitive doesn't
  round-trip — the loop value is an *output*, so there's nothing to write back to (same as Tapestry). Bind
  `row.property`, which edits the shared object.
- **`AjaxFormLoop`** (add/remove rows) works the same for its existing rows; rows added *after* first render
  aren't in the form's field set yet.
- No `ValueEncoder`/hidden form-state is needed — the page instance and its collection are alive in memory,
  so Qloom replays the loop over the live source (Tapestry's volatile mode, done directly).

## Validation

### Per-field: the `validate` spec

`t:validate` is a comma-separated spec. Built-in validators:

| Validator | Effect |
|---|---|
| `required` | non-empty after trim |
| `minlength=N` | at least N characters |
| `maxlength=N` | at most N characters |
| `email` | matches an email pattern (when non-empty) |

```html
<input t:type="textfield" t:id="name" t:validate="required,minlength=2,maxlength=40"/>
<input t:type="textfield" t:id="email" t:validate="required,email"/>
```

The field's label (from its `<t:label>` or humanised id) is used in the message, e.g. *"Name must be
at least 2 characters"*.

> **An unknown validator throws** (fail-loud — same for `t:validate` markup and the `@Validate`
> annotation). It is never silently skipped, since that would leave the field unvalidated. To add
> one, register it in `main.ts`: `Validators.register(name, test, messageKey)` for a validator, or
> `Validators.registerMacro(name, "required,minlength=3,…")` for a Tapestry constraint-type macro
> (hotel-booking registers `username`/`password` macros this way, used as `t:validate="username"`).

### Alternative: the `@Validate` annotation

Instead of `t:validate` markup, put the spec on the page/component field — discovered by the field's
`t:id` (Tapestry's implicit field→property convention). Same validators, same fail-loud rule:

```ts
@Property @Validate("required,minlength=3,maxlength=50") fullname = "";
```

### Cross-field / business validation: return an error from the handler

The `validate` spec only does per-field checks. For anything involving multiple fields or the backend,
validate in the submit handler and **return a message string** (one that isn't a bare route word). The
Form records it and refreshes `<t:errors/>` in place:

```ts
onSubmitFromBookingForm(): unknown {
  const b = this.booking!;
  if (b.checkinDate >= b.checkoutDate) return "Check-out must be after check-in"; // → error
  // … all good …
  return null;   // stay, or return a route to navigate
}
```

**The return-value rule:** a string matching `^[A-Za-z][\w-]*$` (a bare route/page word, no spaces) is
treated as a **navigation target**; any other string (has spaces/punctuation) is recorded as an
**error message**. `null`/`undefined` means "stay on the page". A page class or route name navigates.

## The submit flow (what the Form does)

1. Pull every field's value back to its binding (two-way).
2. Run each field's `validate` spec; collect errors.
3. If any errors → refresh the error displays (`<t:errors/>`), leave inputs and focus untouched, stop.
4. If clean → fire `submit`; your handler runs (may be async, may call the API).
5. Handler threw or returned an error-message string → record it, refresh errors.
6. Handler returned a route/page → `Navigation.navigate(...)` (PRG).
7. Handler returned `null` → stay.

Errors refresh **in place** via the reconciler, so the user's input and cursor survive — no full
re-render.

## Ajax forms — refresh a Zone instead of navigating

Add `t:zone="<zoneId>"` to the Form. On a clean submit the Form refreshes that Zone (re-running its
body) instead of navigating — used for search/filter that updates results without leaving the page:

```html
<form t:type="form" t:id="searchForm" t:zone="result">
  <input t:type="textfield" t:id="query" t:value="criteria.query"/>
  <input type="submit" value="Search"/>
</form>
<div t:type="zone" t:id="result">
  <t:loop source="results" value="hotel">…</t:loop>
</div>
```

```ts
onSubmitFromSearchForm() { this.results = search(this.criteria); /* zone refreshes */ }
```

The submit handler mutates the state the Zone renders; the Form calls `Zones.refreshZone("result")`
for you.

A form can also sit **inside** a zone that something else refreshes: the form reconciles in place
(it is not wholesale-replaced), so its fields keep their focus and uncommitted input across the
refresh.

## Implicit forms

An element with a `t:id` but no `t:type` maps by tag, so `<form t:id="settingsForm">` is a Form and
`<input t:id="password">` is a TextField without spelling out `t:type`. The reference **Settings** page
uses this. Explicit `t:type` is clearer and more common.

## Bean-driven forms

For a form generated from an object's properties, use `beaneditform` (a whole form) or `beaneditor`
(inside your own Form) with `t:object` + `t:include`. See `using-components`.

## Checklist

1. Wrap fields in `<form t:type="form" t:id="...">`; put `<t:errors/>` inside it.
2. Field `t:id` binds the same-named `@Property` unless you set `t:value`.
3. Per-field rules go in `t:validate` (`required,minlength=N,email`); label them with `<t:label for>`.
4. Cross-field/business checks: return an error-message string from `on<Event>From<FormId>`.
5. Return a route/page to navigate (PRG), `null` to stay.
6. For in-place result updates, add `t:zone` to the Form and mutate the zone's state in the handler.
