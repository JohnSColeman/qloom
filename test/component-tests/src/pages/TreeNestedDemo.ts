import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: TreeTests — a multi-level tree. Each branch starts collapsed, so a
 * grandchild ("Resume") is only revealed after expanding both its ancestors
 * ("Files" then "Docs"). "Photo" is a leaf (no toggle).
 */
export class TreeNestedDemo extends Page {
  @Property model = [
    {
      label: "Files",
      children: [{ label: "Docs", children: [{ label: "Resume" }] }, { label: "Photo" }],
    },
  ];
}
