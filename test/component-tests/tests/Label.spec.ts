import { test, expect } from "@playwright/test";

// Source: integration/app1 — Label generates a <label> for a field
test.describe("Label", () => {
  // tapestry: Label with a body renders the body and a for attribute
  test("renders a label with a for attribute and its body", async ({ page }) => {
    await page.goto("/label");
    await expect(page.locator("label[for=email]")).toHaveText("Email:");
  });

  // tapestry: Label with an empty body renders the humanized field id
  test("renders the humanized field id when the body is empty", async ({ page }) => {
    await page.goto("/label");
    await expect(page.locator("label[for=fullName]")).toHaveText("Full Name");
  });
});

// Multi-word humanization and informal pass-through on the bodyless label.
test.describe("Label humanization", () => {
  // functional: a multi-word camelCase field id humanizes every word
  test("humanizes a multi-word camelCase field id", async ({ page }) => {
    await page.goto("/label");
    await expect(page.locator("label[for=checkInDate]")).toHaveText("Check In Date");
  });

  // functional: an informal attribute passes through onto the <label>
  test("passes an informal class through to the label", async ({ page }) => {
    await page.goto("/label");
    await expect(page.locator("label[for=checkInDate]")).toHaveClass(/date-label/);
  });
});
