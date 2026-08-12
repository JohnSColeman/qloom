import { Page } from "@qloom/runtime";
/** Ported from app1 EnvironmentalDemo: a RenderableProvider pushes an ambient
 *  Renderable, and a nested RenderableUser injects it via @Environmental — with
 *  no parameter binding between them — and renders it. */
export class EnvironmentalDemo extends Page {}
