import { test, expect } from "@playwright/test";

// Source: integration/app1/TreeTests.groovy — Tree.
test.describe("Tree", () => {
  // tapestry: TreeTests#basics — renders the root label of the tree model
  test("renders the tree root label", async ({ page }) => {
    await page.goto("/tree");
    await expect(page.getByText("Animals")).toBeVisible();
  });

  // tapestry: TreeTests#basics — child nodes appear when a node is expanded
  test("reveals child nodes when a node is expanded", async ({ page }) => {
    await page.goto("/tree");
    await page.getByText("Animals").click();
    await expect(page.getByText("Cat")).toBeVisible();
    await expect(page.getByText("Dog")).toBeVisible();
  });

  // tapestry: TreeTests — a branch's children start collapsed (hidden) until the
  // node is clicked.
  test("child nodes start collapsed", async ({ page }) => {
    await page.goto("/tree");
    await expect(page.getByText("Cat")).toBeHidden();
    await expect(page.getByText("Dog")).toBeHidden();
  });

  // edge — expanding then re-clicking a node collapses it again (toggle is stable
  // across expand → collapse → expand).
  test("clicking an expanded node collapses it again", async ({ page }) => {
    await page.goto("/tree");
    const animals = page.getByText("Animals");
    await animals.click(); // expand
    await expect(page.getByText("Cat")).toBeVisible();
    await animals.click(); // collapse
    await expect(page.getByText("Cat")).toBeHidden();
    await animals.click(); // expand again
    await expect(page.getByText("Cat")).toBeVisible();
  });

  // tapestry: TreeTests — nested depth: a grandchild is revealed only after both
  // of its ancestors are expanded, one level at a time.
  test("a grandchild reveals only after expanding both ancestor levels", async ({ page }) => {
    await page.goto("/tree-nested");
    await expect(page.getByText("Docs")).toBeHidden();
    await page.getByText("Files").click(); // level 1
    await expect(page.getByText("Docs")).toBeVisible();
    await expect(page.getByText("Photo")).toBeVisible();
    await expect(page.getByText("Resume")).toBeHidden(); // still collapsed under Docs
    await page.getByText("Docs").click(); // level 2
    await expect(page.getByText("Resume")).toBeVisible();
  });

  // edge — only branch nodes get a toggle container; leaf nodes ("Photo",
  // "Resume") do not. The nested model has exactly two branches (Files, Docs).
  test("only branch nodes carry a collapsible container", async ({ page }) => {
    await page.goto("/tree-nested");
    await expect(page.locator("ul div")).toHaveCount(2);
  });

  // edge — an empty model renders an empty tree (no nodes) without crashing.
  test("an empty model renders no nodes and does not crash", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/tree-empty");
    await expect(page.locator("ul li")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // chaos — repeated expand/collapse must not raise console/page errors.
  test("toggling does not raise errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/tree");
    const animals = page.getByText("Animals");
    await animals.click();
    await animals.click();
    await animals.click();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
