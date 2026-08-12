import { registerPhase } from "./registerPhase.js";

export function SetupRender(target: object, key: string): void {
  registerPhase(target, "setupRender", key);
}
