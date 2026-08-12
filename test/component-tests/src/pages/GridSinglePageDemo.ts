import { Page, Property } from "@qloom/runtime";

type Row = { name: string; city: string; note: string };

/**
 * tapestry: GridTests — a source that fits one page (no rowsPerPage) renders no
 * pager. Also carries an `add` column ("note") which, unlike the `include`
 * columns, is not a real row property and so is NOT sortable (no header link).
 */
export class GridSinglePageDemo extends Page {
  @Property items: Row[] = [
    { name: "Alpha", city: "Atlanta", note: "first" },
    { name: "Beta", city: "Boston", note: "second" },
  ];
  @Property currentItem!: Row;
}
