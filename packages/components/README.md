# @qloom/components

Qloom's **built-in component library** — the structural, form, output, bean, and
grid/tree components ported from the canonical Apache Tapestry source to their
exact `@Parameter` shapes, minus the server-only form-state plumbing (PLAN §3).
Behaviour is driven by the render-phase return-value protocol in
[`@qloom/core`](../core) (PLAN §7); study `If.ts`, `Loop.ts`, `Form.ts`, and
`Zone.ts` for the canonical patterns.

## Install

Register them all with one call in your app's `main.ts`, before registering app
components:

```ts
import { registerBuiltins } from "@qloom/components";

registerBuiltins();
```

`BUILTIN_COMPONENT_IDS` exposes the list of registered ids.

## What's included

- **Conditional & looping** — `If`, `Unless`, `Loop`, `Delegate`.
- **Links & buttons** — `EventLink`, `PageLink`, `LinkSubmit`, `Submit`.
- **Forms & fields** — `Form`, `TextField`, `PasswordField`, `TextArea`,
  `Hidden`, `Checkbox`, `Checklist`, `Palette`, `DateField`, `Select`,
  `SelectModel`, `EnumSelectModel`, `RadioGroup`, `Radio`, `Label`,
  `FormFragment`, `SubmitNotifier`, `Errors`, `FieldError`.
- **Captcha** (tapestry-kaptcha) — `KaptchaImage`, `KaptchaField`; configure via
  the `Captcha` static class.
- **Bean display & editing** — `BeanDisplay`, `BeanEditor`, `BeanEditForm`,
  `PropertyDisplay`, `PropertyEditor`.
- **Output & messages** — `Any`, `Output`, `OutputRaw`, `TextOutput`,
  `FontAwesomeIcon`, `Alerts`, `Dynamic`, `Trigger`.
- **Grids, tables & trees** — `Grid`, `Tree`.
- **Ajax** — `Zone`, `AjaxFormLoop`, `AddRowLink`, `RemoveRowLink`,
  `ProgressiveDisplay`, `AjaxLoader`.
- **Dev** — `DevTool`.

`Validators` (from [`@qloom/validation`](../validation)) and the public types
`CaptchaChallenge`, `CaptchaProvider`, `OptionModel` are re-exported for
convenience.

## Notes

- **No app-specific components live here.** Components belonging to an example or
  reference app live in that app (e.g. hotel-booking's `HotelClass` / `Workspace`
  / `YourBookings`), registered in its own `main.ts` (module architecture rule 6).
- Built-ins must emit **`t-`-prefixed** CSS class names to match Tapestry's app
  stylesheets — watch for parity gaps here (see the project's t- prefix note).
- Conformance is covered by the `@qloom/component-tests` Playwright suite
  (`test/component-tests`), which drives each component end-to-end.

Resolves to **source** (`src/index.ts`). Depends on [`@qloom/core`](../core),
[`@qloom/runtime`](../runtime), and [`@qloom/validation`](../validation). Per-component
coverage is tracked in [COMPONENT-REFERENCE.md](../../COMPONENT-REFERENCE.md).
