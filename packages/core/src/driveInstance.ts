/**
 * The render-phase state machine (Tapestry's return-value protocol): drive one
 * instance through setup/begin/afterRender, looping while `afterRender` returns
 * false (this is how `Loop` iterates).
 *
 * Mixins attached to a component interleave with it: each render phase runs
 * before-mixins → the component → after-mixins (Tapestry's @MixinAfter splits
 * every phase in three). A `false` from any participant is the phase's result
 * and short-circuits the rest — so a mixin's `beforeRenderBody → false`
 * (DiscardBody) drops the body just as the component's own would.
 */
import { Assets } from "./Assets.js";
import { PHASES, MIXIN_AFTER } from "./symbols.js";
import type { MarkupWriter, RenderBody, RenderProgram } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

const NO_PHASE = Symbol("no-phase");

function invokePhase(instance: any, phase: string, writer: MarkupWriter): unknown {
  const mapped: string = instance[PHASES]?.[phase] ?? phase;
  const fn = instance[mapped];
  return typeof fn === "function" ? fn.call(instance, writer) : NO_PHASE;
}

/** Run one render phase across before-mixins → host → after-mixins, applying
 *  Tapestry's return-value protocol across all participants: the **first** one to
 *  return a boolean aborts the rest, and that boolean is the phase result; a
 *  void/null return (or no such method) continues to the next; if none returns a
 *  boolean the result is `true` (Tapestry's `RenderPhaseEventHandler.handleResult`
 *  + default). So a mixin's `true` overrides a host's `false`, and a mixin can
 *  drive the loop or skip the body just as the host can — not only via `false`.
 *  With no mixins this is just the host's result. Returns `false` only when the
 *  first boolean seen is `false` (the value the caller keys the state machine on).
 *
 *  `reverse` flips the whole chain (after-mixins → host → before-mixins) for the
 *  *after* render phases — Tapestry runs those in reverse of the *before* phases,
 *  so a "before" mixin's `afterRender` fires **after** the host closes its element
 *  (its `_after` markup lands as a following sibling, not nested inside). */
function drivePhase(
  host: any,
  before: any[],
  after: any[],
  phase: string,
  writer: MarkupWriter,
  reverse = false,
): boolean {
  const sequence = reverse
    ? [...[...after].reverse(), host, ...[...before].reverse()]
    : [...before, host, ...after];
  for (const participant of sequence) {
    const result = invokePhase(participant, phase, writer);
    if (typeof result === "boolean") return result; // first boolean aborts the rest
  }
  return true;
}

function renderContent(
  host: object,
  before: any[],
  after: any[],
  writer: MarkupWriter,
  template?: RenderProgram,
  childBody?: RenderBody,
): void {
  const body: RenderBody = (w) => {
    if (drivePhase(host, before, after, "beforeRenderBody", w) === false) return;
    do {
      childBody?.(w);
    } while (drivePhase(host, before, after, "afterRenderBody", w, true) === false);
  };

  // beforeRenderTemplate/afterRenderTemplate wrap the template render; the body
  // phases nest inside, firing when the template reaches `<t:body/>` (which calls
  // `body`). `false` from beforeRenderTemplate suppresses the template + body;
  // afterRenderTemplate still fires.
  if (drivePhase(host, before, after, "beforeRenderTemplate", writer) !== false) {
    if (template) template(host, writer, body);
    else body(writer);
  }
  drivePhase(host, before, after, "afterRenderTemplate", writer, true);
}

export function driveInstance(
  instance: object,
  writer: MarkupWriter,
  template?: RenderProgram,
  body?: RenderBody,
  mixins?: object[],
): void {
  Assets.process(instance);
  // Partition attached mixins into before/after the host (Tapestry @MixinAfter).
  const before: any[] = [];
  const after: any[] = [];
  if (mixins) {
    for (const m of mixins) {
      Assets.process(m);
      ((m as any)[MIXIN_AFTER] ? after : before).push(m);
    }
  }

  if (drivePhase(instance, before, after, "setupRender", writer) === false) {
    drivePhase(instance, before, after, "cleanupRender", writer, true);
    return;
  }

  // cleanupRender must run even if a render phase throws — otherwise a component
  // that sets shared render-state in beginRender and restores it in cleanupRender
  // (Form ↔ CurrentForm) would strand it, corrupting the next form's fields.
  try {
    let again = true;
    while (again) {
      if (drivePhase(instance, before, after, "beginRender", writer) !== false) {
        renderContent(instance, before, after, writer, template, body);
      }
      again = drivePhase(instance, before, after, "afterRender", writer, true) === false;
    }
  } finally {
    drivePhase(instance, before, after, "cleanupRender", writer, true);
  }
}
