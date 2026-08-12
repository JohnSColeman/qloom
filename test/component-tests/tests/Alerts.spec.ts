import { test, expect } from "@playwright/test";

// Source: component reference — Alerts renders an empty <div> alerts container.
test.describe("Alerts", () => {
  // tapestry: Alerts renders its container element
  test("renders the alerts container element", async ({ page }) => {
    await page.goto("/alerts");
    // Assert the component's OWN output (the alert-container div) carrying the
    // informal id — not just that the hard-coded #alerts element exists, which
    // would pass even if the Alerts component rendered nothing.
    await expect(page.locator("div.alert-container#alerts")).toBeAttached();
  });

  // --- edge -----------------------------------------------------------------

  // tapestry: Alerts renders an EMPTY container by default (no alert children).
  test("renders an empty container by default", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.locator("#alerts")).toBeAttached();
    await expect(page.locator("#alerts > *")).toHaveCount(0);
  });

  // --- chaos ----------------------------------------------------------------

  // tapestry: the container carries the forced `alert-container` class (over any
  // informal class) alongside its informal id, and the page renders fail-loud.
  test("forces the alert-container class and renders fail-loud", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });

    await page.goto("/alerts");
    await expect(page.locator("#alerts")).toHaveClass(/alert-container/);

    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});

// Source: alerts/Alerts.java + AlertStorage/Severity — the alert model. (BACKLOG #4.)
test.describe("Alerts model (source)", () => {
  // tapestry: each alert renders as div.alert.alert-<severity>, in order
  test("renders one alert per source item with its severity class", async ({ page }) => {
    await page.goto("/alerts-source");
    await expect(page.locator("#alerts .alert")).toHaveCount(3);
    await expect(page.locator("#alerts .alert-info")).toHaveText(/Saved successfully\./);
    await expect(page.locator("#alerts .alert-warn")).toHaveText(/Check your input\./);
    await expect(page.locator("#alerts .alert-error")).toContainText("Failed");
  });

  // tapestry: a markup alert renders as raw HTML (the <b> is a real element)
  test("a markup alert renders raw HTML", async ({ page }) => {
    await page.goto("/alerts-source");
    await expect(page.locator("#alerts .alert-error b")).toHaveText("hard");
  });

  // tapestry: a non-markup alert escapes HTML in its message (no injected element)
  test("a non-markup alert escapes its message", async ({ page }) => {
    await page.goto("/alerts-source");
    await expect(page.locator("#alerts .alert-info b")).toHaveCount(0);
  });

  // tapestry: each alert carries a dismiss control that removes it
  test("dismissing an alert removes it", async ({ page }) => {
    await page.goto("/alerts-source");
    await expect(page.locator("#alerts .alert")).toHaveCount(3);
    await page.locator('[data-alert-id="a1"] .alert-dismiss').click();
    await expect(page.locator("#alerts .alert")).toHaveCount(2);
    await expect(page.locator('[data-alert-id="a1"]')).toHaveCount(0);
    // the others remain
    await expect(page.locator('[data-alert-id="a2"]')).toBeVisible();
  });

  // the dismiss control is type=button (so it never submits an enclosing form)
  test("the dismiss control is a button", async ({ page }) => {
    await page.goto("/alerts-source");
    await expect(page.locator("#alerts .alert-dismiss").first()).toHaveAttribute("type", "button");
  });
});

test.describe("Alerts model (dynamic AlertStorage)", () => {
  // tapestry: AlertStorage.add makes an alert appear in the live container
  test("adding an alert shows it in the container", async ({ page }) => {
    await page.goto("/alerts-dynamic");
    await expect(page.locator("#alerts .alert")).toHaveCount(0);
    await page.locator("#add-info").click();
    // the alert div also holds the dismiss ×, so match the message via the span
    await expect(page.locator("#alerts .alert-info .alert-message")).toHaveText("Info 1");
    await page.locator("#add-error").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(2);
    await expect(page.locator("#alerts .alert-error .alert-message")).toHaveText("Error 2");
  });

  // tapestry: dismissing a store-backed alert removes it from the store + DOM
  test("dismissing a store-backed alert removes it", async ({ page }) => {
    await page.goto("/alerts-dynamic");
    await page.locator("#add-info").click();
    await page.locator("#add-error").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(2);
    await page.locator("#alerts .alert-info .alert-dismiss").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(1);
    await expect(page.locator("#alerts .alert-error")).toBeVisible();
  });

  // tapestry: clear() empties the container
  test("clearing removes all alerts", async ({ page }) => {
    await page.goto("/alerts-dynamic");
    await page.locator("#add-info").click();
    await page.locator("#add-error").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(2);
    await page.locator("#clear-alerts").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(0);
  });

  // chaos: adding and dismiss churn raises no errors
  test("add/dismiss churn is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/alerts-dynamic");
    for (let i = 0; i < 3; i++) await page.locator("#add-info").click();
    await expect(page.locator("#alerts .alert")).toHaveCount(3);
    await page.locator("#alerts .alert-dismiss").first().click();
    await expect(page.locator("#alerts .alert")).toHaveCount(2);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
