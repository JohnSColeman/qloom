import { test, expect } from "@playwright/test";

// The internal error-reporting API: a page-render failure is (a) delivered to a
// configured telemetry sink with structured context, and (b) replaced with the
// generic error page — Qloom's telemetry-first replacement for Tapestry's
// ExceptionReport.
test.describe("ErrorReporter", () => {
  test("a render error reaches the configured sink with context, and shows the error page", async ({
    page,
  }) => {
    await page.goto("/reporter-demo");

    // (a) the custom sink received the error + structured context
    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __reported?: { message: string } }).__reported?.message),
      )
      .toContain('required parameter "label"');
    const reported = await page.evaluate(
      () => (window as unknown as { __reported: { phase: string; route: string } }).__reported,
    );
    expect(reported.phase).toBe("render");
    expect(reported.route).toBe("reporter-demo");

    // (b) the generic error page replaced the failed page
    const errorBox = page.locator("[data-qloom-error]");
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText("Something went wrong");
  });

  test("a marked /error.html (convention) overrides the embedded page", async ({ page }) => {
    // The app-root convention: Qloom fetches /error.html and uses it if it
    // carries the data-qloom-error marker (which distinguishes it from an SPA
    // fallback). Mocked here so the app needn't ship an error.html globally.
    await page.route("**/error.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<main data-qloom-error id="custom">Our error page</main>',
      }),
    );

    await page.goto("/required-param"); // throws during render

    const custom = page.locator("#custom");
    await expect(custom).toBeVisible();
    await expect(custom).toHaveText("Our error page");
    // the embedded default is NOT used
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("an unmarked /error.html (SPA fallback) is ignored → embedded page", async ({ page }) => {
    // Simulate a host that 200s the app shell for a missing /error.html.
    await page.route("**/error.html", (route) =>
      route.fulfill({ contentType: "text/html", body: '<div id="app"><script>boot()</script></div>' }),
    );

    await page.goto("/required-param");

    await expect(page.locator("[data-qloom-error]")).toContainText("Something went wrong");
  });

  // A zone-refresh error is SCOPED (Zones.refreshZone's own try/catch): it is
  // reported (phase "zone") but does NOT replace the whole page with the error
  // page — the page stays live and the zone is left as-is. This is the key
  // difference from a page-render failure (which does swap in the error page).
  test("a zone-render error is scoped: reported, page kept, no error page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/zone-error");
    await expect(page.locator("#ze")).toBeVisible();
    await expect(page.locator("#zbody")).toHaveText("ok");

    await page.locator("#bump").click(); // the zone re-render now throws

    // Reported via the default sink with the zone phase…
    await expect.poll(() => errors.join("\n")).toContain("zone boom");
    expect(errors.some((e) => /zone error/.test(e))).toBe(true);

    // …but the failure stayed local: the page is intact, no generic error page,
    // and the zone kept its last-good content.
    await expect(page.locator("#ze")).toBeVisible();
    await expect(page.locator("[data-qloom-error]")).toHaveCount(0);
    await expect(page.locator("#zbody")).toHaveText("ok");
  });
});
