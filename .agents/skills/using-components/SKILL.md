---
name: using-components
description: "Reference for Qloom's built-in component library — the registered t:type name, parameters/bindings, events, and .tml usage of every implemented component (If, Unless, Loop, Delegate, Form, TextField, Select, RadioGroup, DateField, Label, Errors, Submit, EventLink, PageLink, Zone, Grid, BeanDisplay, Output, and more). Use when picking or wiring a built-in component in a template."
---

# Using Built-in Components

`registerBuiltins()` installs Qloom's component library — 48 of Tapestry's 57 core components. This
skill is the reference: for each, its **registered name** (the `t:type` / element tag, matched
case-insensitively), its **parameters or bindings**, the **events it triggers**, and a real usage
snippet. For building forms specifically, pair this with `forms-and-validation`; for the render/event
model, `render-lifecycle`.

## Bindings vs. `@Parameter` — a note on field components

Field components (`TextField`, `PasswordField`, `TextArea`, `Checkbox`, `DateField`, `Hidden`,
`Select`, `RadioGroup`, `KaptchaField`, …) don't declare `value`/`validate`/`model`/`selected` as
`@Parameter` fields — they read them as raw **bindings** (`t:value=`, `t:validate=`, `t:model=`,
`t:selected=`). The important consequence: **`value` falls back to the container property named by the
field's `t:id`** when you don't bind it explicitly. So `<input t:type="textfield" t:id="username"/>`
two-way-binds `this.username` on the page — no `t:value` needed.

Most components also pass through **informal attributes** (`class`, `id`, …) to their rendered element.

## Conditional & Looping

### `if` / `unless`
| param | type | req | default |
|---|---|---|---|
| test | boolean | yes | — |
| negate (`if` only) | boolean | no | false |

`if` renders its body when `test !== negate`, else the `<p:else>` block if present. `unless` renders
its body when `test` is false.
```html
<t:if test="hasHotels">yes<p:else>no</p:else></t:if>
<t:unless test="loggedIn">Please sign in</t:unless>
```

### `loop`
| param | type | req | default |
|---|---|---|---|
| source | Iterable&lt;T&gt; | yes | — |
| value | T | no | (output) |
| index | number | no | 0 |

Iterates `source`, publishing each item to `value`.
```html
<t:loop source="hotels" value="hotel">
  <a t:type="pagelink" t:page="view" t:context="hotel.id">${hotel.name}</a>
</t:loop>
```

### `delegate`
| param | type | req | default |
|---|---|---|---|
| to | Block/RenderBody | yes | — |

Renders the block/body passed via `to` (usually a hoisted `<t:block>`). The wizard mechanism.
```html
<t:delegate to="step"/>
```

## Form & Fields

See `forms-and-validation` for the full flow. Quick reference:

### `form` — triggers **`submit`**
No formal params. Informal attributes pass through; `t:zone` makes it an Ajax form (refreshes that
zone on success). On submit it pulls each field value to its binding, validates field-by-field, then
fires `submit`; the handler's return drives PRG. (This port has no separate `prepare`/`validate`
events.)
```html
<form t:type="form" t:id="searchForm" t:zone="result" class="full-form">…</form>
```

### `textfield` / `passwordfield` / `textarea`
Bindings: `value` (or the `t:id` property), `validate`. Render `<input type=text|password>` /
`<textarea>`, two-way bind, register with the enclosing Form.
```html
<input t:type="textfield" t:id="query" t:value="criteria.query"/>
<input t:type="passwordfield" t:id="password" t:validate="required,minlength=6"/>
```

### `datefield`
Bindings: `value`, `validate`, `format`. Renders a native `<input type="date">`.
```html
<input t:type="datefield" t:id="checkinDate" t:value="booking.checkinDate"/>
```

### `checkbox` / `checklist` / `palette`
- `checkbox` — two-way binds a boolean (`value` or `t:id` property).
- `checklist` — bindings `model` + `selected` (a `string[]`); a vertical list of checkboxes.
- `palette` — bindings `model` + `selected`; two `<select multiple>` list boxes (available/selected).

### `radiogroup` / `radio`
`radiogroup` (bindings: `value`) is a transparent container establishing the shared name + two-way
value; each `radio` (binding: `value`) is checked when its value equals the group's.
```html
<t:radiogroup t:id="smoking" t:value="booking.smoking">
  <t:radio t:id="smoke" t:value="literal:true"/><t:label for="smoke"/>
  <t:radio t:id="nosmoke" t:value="literal:false"/><t:label for="nosmoke"/>
</t:radiogroup>
```

### `select`
Bindings: `model`, `value`. Options come from a `SelectModel`, an array of `{label,value}`/strings, a
comma-separated `literal:` string, or the `<id>Model` container property when `model` is omitted.
```html
<select t:type="select" t:id="rowsPerPage" t:value="criteria.rowsPerPage" t:model="literal:5,10,15,20"/>
```

### `hidden`
Binding: `value`. Round-trips a value as `<input type="hidden">`.

### `label`
Binding: `for`. Renders `<label for>`; a bodyless label uses the `<fieldId>-label` message entry,
else the humanised field id.
```html
<label t:type="label" t:for="checkinDate">Check In Date</label>
<t:label for="smoke"/>
```

### `submit` / `linksubmit` / `submitnotifier`
- `submit` — `<input type="submit">`; label from `t:value`, else the informal `value` attr, else "Submit". Submits the form.
- `linksubmit` — an `<a>` that submits the enclosing form on click.
- `submitnotifier` — non-visual; triggers **`notify`** on its container during submit.
```html
<input type="submit" t:type="submit" value="Search"/>
```

### `formfragment`
| param | type | req | default |
|---|---|---|---|
| visible | boolean | no | true |

A `<div>` wrapper hidden via `display:none` when `visible` is false.

## Errors

### `errors`
Optional `banner` param (default *"You must correct the following errors before continuing."*).
Renders `<div class="t-error">` containing a `<div class="t-banner">` header (the red box the app
stylesheet paints) and a `<ul>` of the enclosing Form's **unassociated** errors (cross-field/handler
errors — per-field errors surface as focus popups on the fields). Patches in place on validation;
the container is always present as a stable patch target. Put it inside the Form.
```html
<t:errors/>
```

### `error` (class `FieldError`)
Binding: `for`. `<span class="error">` for a single field's error.

## Links

### `eventlink` (and alias `actionlink`) — triggers its **`event`**
| param | type | req | default |
|---|---|---|---|
| event | string | no | "action" |
| zone | string | no | — |
| context | unknown | no | — |

Renders `<a href="#">`; on click fires the component event in memory. If the handler returns a value →
navigate; else if `zone` is set → refresh that zone. `actionlink` is `eventlink` with event fixed to
`action`.
```html
<a t:type="eventlink" t:event="cancelBooking" t:context="current">Cancel</a>
```

### `pagelink`
| param | type | req | default |
|---|---|---|---|
| page | string | yes | — |
| context | unknown | no | — |

Renders `<a>` with a **real routable href** (`Navigation.pathFor`); left-click navigates via the SPA,
but middle-click / open-in-new-tab / reload work because the href is real.
```html
<t:pagelink page="view" context="hotel.id">Details</t:pagelink>
```

## Ajax / Zone

### `zone`
| param | type | req | default |
|---|---|---|---|
| elementName | string | no | "div" |

A wrapper element carrying its `t:id`; registers itself so `Zones.refreshZone(id)` (or an Ajax
form/eventlink targeting it) patches it in place. See `render-lifecycle`.
```html
<div t:type="zone" t:id="result" class="section result">…results…</div>
```

### `ajaxformloop` + `addrowlink` / `removerowlink`
A Loop (bindings: `source`, `value`) with client-side add/remove of rows; the two link components
call its `addRow()` / `removeRow(i)`.

### `progressivedisplay`
Renders `loading …`, then reveals its real body via a deferred patch.

### `ajaxloader`
A `<span class="ajax-loader">` placeholder; `<span t:type="ajaxloader" t:trigger="searchForm" t:zone="result">`.

## Grid & Bean

### `grid`
| param | type | req | default |
|---|---|---|---|
| source | Iterable | no | — |
| include | string (csv) | no | "" |
| add | string (csv) | no | "" |
| rowsPerPage | number | no | 0 |
| row | (output) | no | — |

Renders a `<table class="t-data-grid">`. `include` = ordered sortable columns; `add` = extra
non-sortable columns; `row` publishes the current row for `<p:<col>Cell>` block overrides; `<p:empty>`
renders when the source is empty. Paginates when `rowsPerPage > 0`; sort/page re-render in place.
```html
<table t:type="grid" t:source="source" t:inPlace="true" t:rowsPerPage="criteria.rowsPerPage"
       t:include="name,address,zip" t:add="cityState,action" t:row="currentHotel">
  <p:actionCell><a t:type="pagelink" t:page="view" t:context="currentHotel">Details</a></p:actionCell>
  <p:empty>${message:no-result}</p:empty>
</table>
```

### `beandisplay`
| param | type | req | default |
|---|---|---|---|
| object | any | no | — |
| include | string (csv) | no | "" |
| exclude | string (csv) | no | "" |

Renders a bean as `<dl class="t-beandisplay">`. `include` orders, `exclude` omits; a `<p:<prop>>`
block overrides that property's rendering.
```html
<div t:type="beandisplay" t:object="hotel" t:include="name,city,stars" t:exclude="id">
  <p:stars><t:hotelclass stars="hotel?.stars"/></p:stars>
</div>
```

### `beaneditform` (triggers **`submit`**) / `beaneditor` / `propertydisplay` / `propertyeditor`
- `beaneditform` — a full `<form>` with a field per property + Save; fires `submit`.
- `beaneditor` — the field-per-property UI, used inside a Form.
- `propertydisplay` — writes `object[property]` as text.
- `propertyeditor` — an `<input>` for one property, two-way bound.

Params for all: `object`, `include`/`exclude` (forms) or `property` (single-property).

## Output & Misc

| Component | Param(s) | Renders |
|---|---|---|
| `output` | value (+ format) | `value` as text |
| `outputraw` | value | unfiltered markup (`writer.raw`) |
| `textoutput` | value | each newline-split line in its own `<p>` |
| `any` | element (default "div") | an arbitrary element + informals around its body |
| `alerts` | — | `<div class="alert-container">` for alert messages |
| `dynamic` | template | a `<div>` with raw `template` markup |
| `trigger` | event (default "action") | nothing; fires `event` during render (triggers **`event`**) |
| `fontawesomeicon` | icon | `<i class="fa fa-<icon>">` |
| `tree` | model | recursive `<ul>/<li>` tree of expandable nodes |
| `devtool` | — | a dev menu with a Reload button |

```html
from <t:output value="current?.checkinDate"/> to <t:output value="current?.checkoutDate"/>
```

## Captcha

`kaptchaimage` renders the challenge `<img>` and fetches its `src` from the app-supplied provider
(`Captcha.configureCaptcha({ newChallenge })`), recording the challenge id. `kaptchafield` is a text
field for the answer; the form's submit handler verifies it via the API. See the Signup page in the
reference app.

## Events summary

Only these built-ins trigger component events: **`form`** and **`beaneditform`** → `submit`;
**`eventlink`**/**`actionlink`** and **`trigger`** → their `event` param (default `action`);
**`submitnotifier`** → `notify`. Notably `select` does **not** emit `valueChanged` in this port.

## Not implemented

Mixins (`Autocomplete`, `Confirm`, `ZoneRefresh`, `TriggerFragment`, `FormGroup`, …), built-in
Tapestry pages, base components, and server/SSR-only components (`Upload`, `Doctype`, `ExceptionReport`,
…) are out of scope — Qloom has no mixin subsystem and is browser-only. See `COMPONENT-REFERENCE.md`
for the full coverage table.
