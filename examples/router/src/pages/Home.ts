import { Page, Persist, SessionState } from "@qloom/runtime";

/** A trivial SSO for the `create: false` demo. */
class DemoState {}

/**
 * The index page ("/"). Demonstrates the persistence decorators:
 *   - `visits`    — @Persist('local'): survives reloads (encrypted at rest).
 *   - `flashNote` — @Persist('flash'): survives exactly one activation.
 *   - `demo`      — @SessionState(create:false): not created until set, with a
 *                   companion `demoExists` reflecting whether it exists.
 */
export class Home extends Page {
  @Persist("local") visits?: number;
  @Persist("flash") flashNote?: string;

  @SessionState(DemoState, { create: false })
  demo!: DemoState | undefined;
  declare demoExists: boolean; // companion defined by @SessionState(create:false)

  onActivate(): void {
    this.visits = (this.visits ?? 0) + 1;
  }

  get flashMessage(): string {
    return this.flashNote ?? "";
  }

  onNotify(): unknown {
    this.flashNote = "flashed";
    return "home"; // redirect to self — the flash is readable on the next render
  }

  onCreateDemo(): unknown {
    this.demo = new DemoState(); // creates the SSO
    return "home";
  }
}
