import { registerPhase } from "./registerPhase.js";

export function CleanupRender(target: object, key: string): void {
  registerPhase(target, "cleanupRender", key);
}
