import { registerPhase } from "./registerPhase.js";

export function AfterRenderTemplate(target: object, key: string): void {
  registerPhase(target, "afterRenderTemplate", key);
}
