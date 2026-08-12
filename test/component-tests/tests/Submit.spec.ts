import { test, expect } from "@playwright/test";

// Source: corelib/components/SubmitTest.java + FormTests (Submit triggers form submit)
test.describe("Submit", () => {
  // tapestry: Submit renders an <input type="submit"> with its value
  test("renders an input[type=submit] with its value", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator("input[type=submit]")).toHaveValue("Save");
  });

  // tapestry: SubmitTest#test_submit_event_fired — clicking Submit submits the form
  test("clicking Submit submits the enclosing form (PRG)", async ({ page }) => {
    await page.goto("/submit");
    await page.locator("input[name=name]").fill("Grace");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/submit-result\/Grace$/);
    await expect(page.locator("#result")).toHaveText("Submitted: Grace");
  });

  // functional: the Form attaches a native submit listener, so pressing Enter in
  // a text field submits the form exactly like clicking the Submit control.
  test("pressing Enter in a field submits the form (PRG)", async ({ page }) => {
    await page.goto("/submit");
    await page.locator("input[name=name]").fill("Hopper");
    await page.locator("input[name=name]").press("Enter");
    await expect(page).toHaveURL(/\/submit-result\/Hopper$/);
    await expect(page.locator("#result")).toHaveText("Submitted: Hopper");
  });

  // chaos: a clean submit must not raise a console/page error, and must navigate
  // once (the success handler fires exactly one navigation).
  test("submitting is error-free and navigates once", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/submit");
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/submit-result\/Ada$/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});

// Source: corelib/components/Submit.java + SubmitMode (NORMAL/CANCEL/UNCONDITIONAL).
// mode is rendered as data-submit-mode; CANCEL and UNCONDITIONAL bypass the
// Form's client-side validation, NORMAL enforces it.
test.describe("Submit mode", () => {
  // tapestry: mode renders as the data-submit-mode attribute (default "normal")
  test("renders data-submit-mode for each mode", async ({ page }) => {
    await page.goto("/submit-mode");
    await expect(page.locator("#go")).toHaveAttribute("data-submit-mode", "normal");
    await expect(page.locator("#cancelBtn")).toHaveAttribute("data-submit-mode", "cancel");
    await expect(page.locator("#uncond")).toHaveAttribute("data-submit-mode", "unconditional");
  });

  // tapestry: a NORMAL submit runs validation — the blank required field blocks
  // submission (stays on the page, shows an error, no navigation)
  test("NORMAL submit is blocked by the blank required field", async ({ page }) => {
    await page.goto("/submit-mode");
    await page.locator("#go").click();
    // validation blocks: no navigation, we stay on the form page
    await expect(page).toHaveURL(/\/submit-mode$/);
    await expect(page).not.toHaveURL(/submit-result/);
    // the required field is flagged invalid (Qloom adds the t-error class)
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
  });

  // tapestry: a CANCEL submit bypasses validation — reaches the handler despite
  // the blank required field
  test("CANCEL submit bypasses validation and reaches the handler", async ({ page }) => {
    await page.goto("/submit-mode");
    await page.locator("#cancelBtn").click();
    await expect(page).toHaveURL(/\/submit-result\/blank$/);
  });

  // tapestry: an UNCONDITIONAL submit also bypasses validation
  test("UNCONDITIONAL submit bypasses validation and reaches the handler", async ({ page }) => {
    await page.goto("/submit-mode");
    await page.locator("#uncond").click();
    await expect(page).toHaveURL(/\/submit-result\/blank$/);
  });

  // functional: a NORMAL submit still succeeds once the required field is filled
  test("NORMAL submit succeeds when the required field is filled", async ({ page }) => {
    await page.goto("/submit-mode");
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/submit-result\/Ada$/);
  });

  // chaos: a bypassing (cancel) submit raises no page or console errors
  test("a bypassing submit is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/submit-mode");
    await page.locator("#cancelBtn").click();
    await expect(page).toHaveURL(/\/submit-result\/blank$/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
