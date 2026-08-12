import { registerPhase } from "./registerPhase.js";

export function AfterRender(target: object, key: string): void {
  registerPhase(target, "afterRender", key);
}
