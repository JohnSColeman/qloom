import { Composite } from "./Composite.js";
import type { Validator, ValidatorDef, Rule, CompositeValidator } from "./types.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The FieldValidatorSource analogue: a plugin registry of named validators +
 *  macros, and a parser from a Tapestry `@Validate` string to a composite. */
export class Validators {
  private static registry = new Map<string, ValidatorDef>();
  private static macros = new Map<string, string>();

  static register(name: string, test: Validator, messageKey: string, required = false): void {
    Validators.registry.set(name, { test, messageKey, required });
  }

  static registerMacro(name: string, spec: string): void {
    Validators.macros.set(name, spec);
  }

  static build(spec: string): CompositeValidator {
    return new Composite(Validators.parse(spec));
  }

  /** Parse a `@Validate` string into ordered rules, expanding macros in place. */
  private static parse(spec: string): Rule[] {
    const rules: Rule[] = [];
    for (const term of Validators.split(spec)) {
      const eq = term.indexOf("=");
      const name = (eq === -1 ? term : term.slice(0, eq)).trim();
      const constraint = eq === -1 ? undefined : term.slice(eq + 1).trim();
      const macro = Validators.macros.get(name);
      if (macro !== undefined) {
        rules.push(...Validators.parse(macro)); // recursive expansion
        continue;
      }
      const def = Validators.registry.get(name);
      // One policy for every source (@Validate annotation *and* t:validate
      // markup): an unknown validator is a programmer error and fails loudly.
      // Silently skipping it would leave the field unvalidated — the dangerous
      // direction for a form framework.
      if (!def) {
        throw new Error(
          `qloom: unknown validator "${name}" in validate spec "${spec}". ` +
            `Register it with Validators.register("${name}", …) or, for a Tapestry ` +
            `constraint-type macro, Validators.registerMacro("${name}", "…").`,
        );
      }
      rules.push({ name, def, constraint });
    }
    return rules;
  }

  /** Split on commas, except inside `{n,m}` quantifiers and escaped `\,`. */
  private static split(spec: string): string[] {
    return spec.split(/(?<!\\)\s*,\s*(?!\d*\})/).map((s) => s.trim()).filter(Boolean);
  }
}

// Built-ins (M1). Non-required validators pass on blank (required owns blankness).
Validators.register("required", (v) => v.trim() !== "", "required", true);
Validators.register("minlength", (v, c) => v === "" || v.length >= Number(c), "minimum-string-length");
Validators.register("maxlength", (v, c) => v.length <= Number(c), "maximum-string-length");
Validators.register("email", (v) => v === "" || EMAIL.test(v), "invalid-email");
