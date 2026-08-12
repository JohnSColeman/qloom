import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, Zones, BINDINGS, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter, RenderBody, Binding } from "@qloom/core";
import { humanize } from "./humanize.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Per-grid current page, keyed by the grid's `t:id` — survives re-renders. */
const gridPages = new Map<string, number>();

/** Per-grid sort state (column + direction), keyed by the grid's `t:id`. */
const gridSorts = new Map<string, { column: string; ascending: boolean }>();

/** White sort indicators as self-contained SVG data-URIs, so the
 *  `<img class="t-sort-icon">` needs no external asset (Tapestry serves these
 *  from the tapestry-core classpath, which Qloom has no equivalent of). Every
 *  sortable column shows one: a neutral up/down when inactive, a single arrow
 *  for the active ascending/descending column. */
const svgIcon = (body: string): string =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='9' height='11'>${body}</svg>`)}`;
const SORT_ICON = {
  ascending: svgIcon("<polygon points='4.5,2 8,8 1,8' fill='white'/>"),
  descending: svgIcon("<polygon points='1,3 8,3 4.5,9' fill='white'/>"),
  sortable: svgIcon(
    "<polygon points='4.5,0 8,4 1,4' fill='white' opacity='0.6'/><polygon points='1,7 8,7 4.5,11' fill='white' opacity='0.6'/>",
  ),
};

/**
 * Tapestry: `Grid` — renders a collection as a table. `include` (+ `add`) give the
 * ordered columns; `row` is the current-row output binding (like Loop's `value`),
 * so `p:<column>Cell` blocks can read it; `p:empty` renders when the source is
 * empty. With `rowsPerPage`, it paginates and renders a pager that re-renders the
 * table in place on click. `include` columns (backed by a row property) are
 * sortable via clickable header links; `add` columns are not.
 */
export class Grid extends Component {
  @Parameter() source: any;
  @Parameter() include = "";
  @Parameter() add = "";
  @Parameter() rowsPerPage = 0;

  private wrapper: Element | null = null;
  private gridId = "grid";

  beginRender(writer: MarkupWriter): boolean {
    this.gridId = ((this as any)[COMPONENT_ID] as string) ?? "grid";
    writer.element("div");
    applyInformals(writer, this);
    // The app stylesheet targets `DIV.t-data-grid`; merge with any informal class.
    const informalClass = writer.currentElement()?.getAttribute("class");
    writer.attribute("class", informalClass ? `t-data-grid ${informalClass}` : "t-data-grid");
    this.wrapper = writer.currentElement();
    this.renderGrid(writer);
    return false; // no body
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  private refresh(): void {
    if (this.wrapper) Zones.patch(this.wrapper, (w) => this.renderGrid(w));
  }

  private renderGrid(writer: MarkupWriter): void {
    const bindings = (this as any)[BINDINGS] ?? {};
    const includeCols = this.include.split(",").map((s) => s.trim()).filter(Boolean);
    const addCols = this.add.split(",").map((s) => s.trim()).filter(Boolean);
    const columns = [...includeCols, ...addCols];
    const sortable = new Set(includeCols); // only real-property columns sort

    // Sort the source (a copy) by the active sort column, if any.
    const sort = gridSorts.get(this.gridId);
    const allItems = [...((this.source as Iterable<any>) ?? [])];
    const items =
      sort && sortable.has(sort.column)
        ? [...allItems].sort(
            (a, b) => compareValues(a[sort.column], b[sort.column]) * (sort.ascending ? 1 : -1),
          )
        : allItems;

    if (items.length === 0) {
      const empty = bindings.empty?.get?.();
      if (typeof empty === "function") (empty as RenderBody)(writer);
      return;
    }

    const perPage = Number(this.rowsPerPage) > 0 ? Number(this.rowsPerPage) : items.length;
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    let page = gridPages.get(this.gridId) ?? 0;
    if (page >= totalPages) page = 0;
    const pageItems = items.slice(page * perPage, (page + 1) * perPage);
    const rowBinding = bindings.row as Binding | undefined;

    writer.element("table");
    writer.attribute("class", "t-data-grid");
    writer.element("thead");
    writer.element("tr");
    for (const col of columns) {
      writer.element("th");
      if (sortable.has(col)) {
        const active = sort?.column === col;
        const direction = active ? (sort!.ascending ? "ascending" : "descending") : "sortable";
        writer.attribute("data-grid-column-sort", direction);
        writer.element("a");
        const link = writer.currentElement();
        writer.attribute("href", "#");
        writer.text(humanize(col));
        // Every sortable column carries an icon: neutral when inactive, a single
        // arrow for the active ascending/descending column.
        writer.element("img");
        writer.attribute("class", "t-sort-icon");
        writer.attribute("src", SORT_ICON[direction]);
        writer.attribute("alt", direction);
        writer.end();
        const column = col;
        link?.addEventListener("click", (e) => {
          e.preventDefault();
          const cur = gridSorts.get(this.gridId);
          gridSorts.set(
            this.gridId,
            cur && cur.column === column
              ? { column, ascending: !cur.ascending }
              : { column, ascending: true },
          );
          gridPages.set(this.gridId, 0); // sorting resets to the first page
          this.refresh();
        });
        writer.end(); // a
      } else {
        writer.text(humanize(col));
      }
      writer.end(); // th
    }
    writer.end(); // tr
    writer.end(); // thead
    writer.element("tbody");
    for (const item of pageItems) {
      rowBinding?.set?.(item); // set the current-row property before its cells render
      writer.element("tr");
      for (const col of columns) {
        writer.element("td");
        const cell = bindings[`${col}Cell`]?.get?.();
        if (typeof cell === "function") (cell as RenderBody)(writer);
        else writer.text(String(item[col] ?? ""));
        writer.end();
      }
      writer.end();
    }
    writer.end();
    writer.end();

    if (totalPages > 1) {
      writer.element("div");
      writer.attribute("class", "t-data-grid-pager");
      for (let p = 0; p < totalPages; p++) {
        if (p === page) {
          writer.element("span");
          writer.attribute("class", "current");
          writer.text(String(p + 1));
          writer.end();
        } else {
          writer.element("a");
          writer.attribute("href", "#");
          writer.text(String(p + 1));
          const link = writer.currentElement();
          const target = p;
          link?.addEventListener("click", (e) => {
            e.preventDefault();
            gridPages.set(this.gridId, target);
            this.refresh();
          });
          writer.end();
        }
      }
      writer.end();
    }
  }
}

/** Natural-order comparison used by column sorting: numbers numerically, other
 *  values by locale-aware string compare; nullish sorts first. */
function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}
