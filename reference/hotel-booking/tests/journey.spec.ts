import { test, expect } from "@playwright/test";

/**
 * End-to-end user journey — one continuous session, navigating the app by
 * *clicks only* (no page reloads after the first load). This proves the pages
 * compose into a real flow and that in-memory session state (the mock
 * Authenticator + the UserWorkspace booking) survives SPA navigation, which a
 * per-page `goto` test can't show:
 *
 *   Signin → (login) → Search → Details → View → Book this Hotel → Book form
 *          → (submit) → confirmation → Confirm → back to Search
 */
test("a logged-in user searches, views a hotel, books it, and confirms", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // Async render rejections surface as console errors, not pageerror — capture both.
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  // 1. Land on the app → redirected to Signin.
  await page.goto("/");
  await expect(page).toHaveURL(/\/signin$/);

  // 2. Log in → redirected to Search, authenticated nav appears.
  await page.locator("input[name=username]").fill("JohnDoe");
  await page.locator("input[name=password]").fill("secret");
  await page.locator("input[type=submit]").click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.locator("ul.nav li")).toHaveCount(4);
  await expect(page.locator("#result table.t-data-grid tbody tr")).toHaveCount(2);

  // 3. Open the first hotel's details (SPA click, not a reload).
  await page.getByRole("link", { name: "Details" }).first().click();
  await expect(page).toHaveURL(/\/view\/1$/);
  await expect(page.locator("h2")).toHaveText("Hotel details");
  await expect(page.locator("dl.t-beandisplay")).toContainText("Marriott Courtyard");

  // 4. Start a booking → Book page (the workspace now holds the booking).
  await page.locator('input[value="Book this Hotel"]').click();
  await expect(page).toHaveURL(/\/book\/1$/);
  // The Book page also renders the <t:workspace/> "Booking in progress" panel
  // (a booking is now in progress), so scope to the page heading.
  await expect(page.getByRole("heading", { name: "Book hotel room" })).toBeVisible();
  await expect(page.locator("dl.t-beandisplay").first()).toContainText("Marriott Courtyard");

  // 5. Fill the booking form and submit → confirmation step (same session).
  await page.locator("input[name=creditCardNumber]").fill("4111111111111111");
  await page.locator('input[value="Book"]').click();
  await expect(page.locator('input[value="Confirm"]')).toBeVisible();
  await expect(page.locator("dl.t-beandisplay").last()).toContainText("#### #### #### 1111");

  // 6. Confirm → back to Search, still authenticated.
  await page.locator('input[value="Confirm"]').click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.locator("ul.nav li")).toHaveCount(4);
  await expect(page.locator("#result table.t-data-grid")).toBeAttached();

  // 7. The confirmed booking is persisted to the backend and shown by the
  //    <t:yourbookings/> panel (re-read on Search activation).
  await expect(page.locator("#your-bookings")).toContainText("Marriott Courtyard");

  // 8. Cancel it → the delete hits the backend, the mybookings zone refreshes,
  //    and the (now empty) YourBookings panel renders nothing.
  await page.locator("#your-bookings").getByRole("link", { name: "Cancel" }).click();
  await expect(page.locator("#your-bookings")).toHaveCount(0);

  expect(errors).toEqual([]); // no uncaught errors across the whole journey
});
