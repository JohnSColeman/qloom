# @qloom/validation

Annotation-driven **form validation** for Qloom, ported from Tapestry. It backs the
`@Validate` decorator (in [`@qloom/runtime`](../runtime)) and the `t:validate`
markup constraint syntax, applying validators to form fields and producing
Tapestry-verbatim error messages.

## API

- **`Validators`** — the static plugin registry and macro parser:
  - `Validators.register(name, validator)` — register a validator (e.g. `required`,
    `minLength`, `maxLength`, `regexp`).
  - `Validators.registerMacro(name, spec)` — register a Tapestry **constraint-type
    macro** (the hotel-booking app registers `username` / `password` this way).
  - It parses the macro string form (`required,minLength=3`) into a `Composite`
    (first-failure rule set).
- **`ValidationMessages`** — the Tapestry-verbatim message catalogue for the
  built-in validators.

## Error policy — **one rule for both authoring styles**

An **unknown validator throws**, whether the spec came from the `@Validate`
annotation or from `t:validate` markup. Validation is **never silently skipped**.
If you use a custom validator name, you must register it first via
`Validators.register(...)` (a validator) or `Validators.registerMacro(...)` (a
constraint-type macro). This fail-loud stance is deliberate — see
[CLAUDE.md](../../CLAUDE.md).

## Register a custom validator (in your app's `main.ts`)

```ts
import { Validators } from "@qloom/validation";

Validators.register("even", {
  validate(value) {
    if (value % 2 !== 0) return "Must be an even number.";
  },
});
```

## Conventions

`Validators` and `ValidationMessages` are static classes (shared mutable registry
state). One class per file; pure types (`Validator`, `CompositeValidator`) in
`types.d.ts`. Resolves to **source** (`src/index.ts`). Depends on
[`@qloom/core`](../core). Fields use these through [`@qloom/components`](../components)
(`TextField`, `Form`, `Errors`, …).
