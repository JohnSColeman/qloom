import { registerPhase } from "./registerPhase.js";

export function AfterRenderBody(target: object, key: string): void {
  registerPhase(target, "afterRenderBody", key);
}
