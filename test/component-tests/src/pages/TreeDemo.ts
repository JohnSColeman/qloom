import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: TreeTests — Tree renders a recursive tree of expandable/collapsible
 * nodes from a TreeModel.
 */
export class TreeDemo extends Page {
  @Property model = [
    { label: "Animals", children: [{ label: "Cat" }, { label: "Dog" }] },
  ];
}
