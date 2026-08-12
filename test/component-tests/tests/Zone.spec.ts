import { test, expect } from "@playwright/test";

// Source: integration/app1/ZoneTests.java
test.describe("Zone", () => {
  // tapestry: ZoneTests#zone_updates
  test("EventLink updates the bound zone client-side", async ({ page }) => {
    await page.goto("/zone");
    await expect(page.locator("#status")).toHaveText("No name has been selected.");
    await page.locator("#select-link").click();
    await expect(page.locator("#status")).toHaveText('Selected: Mr. <Roboto>');
  });

  // tapestry: ZoneTests#update_zone_with_empty_body (TAP5 zone empty body)
  test("zone updates from empty to a message", async ({ page }) => {
    await page.goto("/zone");
    await expect(page.locator("#zone-update-message")).toHaveText("");
    await page.locator("#empty-link").click();
    await expect(page.locator("#zone-update-message")).toHaveText("Zone updated.");
  });

  // A second event on the same zone must land on the LATEST value — a dynamic
  // body (${count}) re-rendered twice in a row, not a stale first render.
  test("a second update to the same zone lands on the latest value", async ({ page }) => {
    await page.goto("/zone");
    await expect(page.locator("#counter")).toHaveText("0");
    await page.locator("#bump-link").click();
    await expect(page.locator("#counter")).toHaveText("1");
    await page.locator("#bump-link").click();
    await expect(page.locator("#counter")).toHaveText("2");
  });

  // refreshZone is scoped to ONE registration: updating one zone must not
  // re-render a sibling zone (its DOM node — and any state on it — is untouched).
  test("updating one zone leaves a sibling zone's node untouched", async ({ page }) => {
    await page.goto("/zone");
    // Tag the sibling (messageZone) node; a JS property survives only if the
    // node is never re-rendered.
    await page.evaluate(() => {
      (document.querySelector("#zone-update-message") as unknown as { __tag: string }).__tag = "keep";
    });

    await page.locator("#select-link").click(); // updates nameZone only
    await expect(page.locator("#status")).toHaveText('Selected: Mr. <Roboto>');

    const untouched = await page.evaluate(
      () =>
        (document.querySelector("#zone-update-message") as unknown as { __tag?: string }).__tag ===
        "keep",
    );
    expect(untouched).toBe(true);
  });

  // Fail-loud: exercising the zone updates must not surface any pageerror or
  // console error.
  test("zone interactions produce no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/zone");
    await page.locator("#select-link").click();
    await page.locator("#empty-link").click();
    await page.locator("#bump-link").click();
    await expect(page.locator("#counter")).toHaveText("1");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // tapestry: ZoneTests#select_zone
  // skip: cascading Select + Form + server validation; needs the Form family.
  test.skip("cascading select updates a dependent zone", async () => {});

  // tapestry: ZoneTests#zone_redirect_by_class
  // skip: server-side redirect to another page from a zone event (SSR-only).
  test.skip("zone event can redirect to another page", async () => {});

  // tapestry: ZoneTests#update_multiple_zones_at_once
  // skip: MultiZoneUpdate server API; Qloom refreshes one zone per event.
  test.skip("updates multiple zones at once", async () => {});

  // tapestry: ZoneTests#multi_zone_update_using_string_in_loop
  // skip: MultiZoneUpdate inside a Loop; same server API dependency.
  test.skip("multi-zone update using string in a loop", async () => {});

  // tapestry: ZoneTests#zone_namespace_interaction_fixed
  // skip: JS namespace interaction; framework/asset concern, not the component.
  test.skip("zone namespace interaction", async () => {});

  // tapestry: ZoneTests#zone_updated_event_triggered_on_client
  // skip: client-side 'zone:didUpdate' event dispatch not modelled in Qloom.
  test.skip("zone:updated event triggered on client", async () => {});

  // tapestry: ZoneTests#link_submit_inside_form_that_updates_a_zone
  // skip: needs LinkSubmit (backlog component).
  test.skip("LinkSubmit inside a form updates a zone", async () => {});

  // tapestry: ZoneTests#zone_inject_component_from_template
  // skip: @InjectComponent server-side wiring; not a browser-observable contract.
  test.skip("zone injects a component from the template", async () => {});

  // tapestry: ZoneTests#update_zone_inside_form
  // skip: zone update triggered from within a Form submit; Form family.
  test.skip("update a zone inside a form", async () => {});

  // tapestry: ZoneTests#update_to_zone_inside_form
  // skip: zone-inside-form update variant; Form family.
  test.skip("update to a zone inside a form", async () => {});

  // tapestry: ZoneTests#css_insertion_point
  // skip: asset/CSS insertion-point behavior; framework concern.
  test.skip("css insertion point", async () => {});

  // tapestry: ZoneTests#update_zone_with_no_clientid (TAP5-2330)
  // skip: AjaxResponseRenderer server API (render a zone with no client id).
  test.skip("update a zone with no client id via AjaxResponseRenderer", async () => {});
});
