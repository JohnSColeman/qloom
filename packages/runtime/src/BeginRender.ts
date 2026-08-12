import { registerPhase } from "./registerPhase.js";

export function BeginRender(target: object, key: string): void {
  registerPhase(target, "beginRender", key);
}
