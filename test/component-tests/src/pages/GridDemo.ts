import { Page, Property } from "@qloom/runtime";

type Row = { name: string; city: string; price: number };

/**
 * tapestry: GridTests — Grid presents tabular data in a <table>, deriving column
 * headers from the model, paginating via rowsPerPage, and supporting cell blocks.
 */
export class GridDemo extends Page {
  @Property items: Row[] = [
    { name: "Alpha", city: "Atlanta", price: 120 },
    { name: "Beta", city: "Boston", price: 95 },
    { name: "Gamma", city: "Chicago", price: 200 },
  ];
  @Property currentItem!: Row; // grid `row` output binding
}
