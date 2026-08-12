import { Page } from "@qloom/runtime";
import { ErrorReporter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Attaches a custom telemetry sink, then renders a component that throws — so
 *  the test can assert the render error reaches the configured reporter with its
 *  context (and that the generic error page is shown). */
export class ReporterDemo extends Page {
  override onActivate(): void {
    ErrorReporter.configure({
      report(error, ctx) {
        (window as any).__reported = {
          message: error instanceof Error ? error.message : String(error),
          phase: ctx.phase,
          route: ctx.route,
        };
      },
    });
  }
}
