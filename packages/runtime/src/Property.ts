import { registerProperty } from "./registerProperty.js";

/** Marks a field as a bindable, template-readable property. */
export function Property(target: object, key: string | symbol): void {
  registerProperty(target, key);
}
