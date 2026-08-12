/** Types for @qloom/router — history binding and the onActivate/onPassivate contract. */
import type { RenderProgram } from "@qloom/core";
import type { Page } from "@qloom/runtime";

export type PageClass = new () => Page;

export interface PageRoute {
  /** Route segment, lowercased. The `index` route serves "/". */
  name: string;
  page: PageClass;
  template: RenderProgram;
}

export interface RouterOptions {
  routes: PageRoute[];
  mount: Element;
  /** Which route serves "/" (default "index"). */
  indexRoute?: string;
  /**
   * URL path the app is mounted under, when it isn't the domain root — e.g.
   * `/my-repo/` for a GitHub Pages project site. Pass Vite's `import.meta.env.BASE_URL`.
   * The router strips it when reading the address bar and prepends it to every
   * generated path/href, so clean History-API URLs keep working under a sub-path.
   * Defaults to `/` (root).
   */
  basename?: string;
}
