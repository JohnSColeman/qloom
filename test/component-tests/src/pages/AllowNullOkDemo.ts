import { Page, Property } from "@qloom/runtime";

/** Binds `strict` (allowNull=false) to a non-null value and `lax` (default
 *  allowNull=true) to a null property — so the strict param renders and the null
 *  lax param reads through without error. */
export class AllowNullOkDemo extends Page {
  @Property present = "S";
  @Property nothing: string | null = null;
}
