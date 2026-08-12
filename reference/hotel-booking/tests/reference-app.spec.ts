import { test, expect } from "@playwright/test";

/**
 * Parity checks against the *unmodified* hotel-booking templates. As of M4,
 * loading "/" runs Index.onActivate() → redirect to Signin, which renders the
 * login form through Layout. Each assertion maps to a PARITY.md scorecard row.
 */
test.describe("M4 — Index redirects to Signin, rendered via Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Index.onActivate redirects to /signin", async ({ page }) => {
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("renders the Layout chrome", async ({ page }) => {
    await expect(page.locator("#aside")).toContainText("Welcome to Tapestry 5 Hotel Booking");
    await expect(page.locator("#bar strong")).toContainText("Feel at Home");
    await expect(page.locator("#footer")).toContainText("Created with Qloom");
    await expect(page.locator("#content")).toBeAttached();
  });

  test("binds Signin's literal pageTitle into the title", async ({ page }) => {
    const title = await page.locator("#app title").textContent();
    expect(title).toBe("Tapestry 5 Hotel Booking - Members login");
  });

  test("renders the login form (form + text + password inputs)", async ({ page }) => {
    await expect(page.locator("form")).toBeAttached();
    await expect(page.locator("form input")).toHaveCount(3); // username, password, submit
    await expect(page.locator("input[type=password]")).toHaveCount(1);
    await expect(page.locator("form")).toHaveClass(/full-form/); // host-form informal param applied
  });

  test("delegates the <p:sidebar> block into Layout's sidebar", async ({ page }) => {
    await expect(page.locator(".col")).toContainText("Welcome to Tapestry Hotel Booking");
  });

  test("PageLink 'Register now!' has a real routable href", async ({ page }) => {
    const link = page.getByRole("link", { name: "Register now!" });
    await expect(link).toHaveAttribute("href", "/signup");
  });

  test("hides the nav when logged out (t:security.authenticated renders nothing)", async ({ page }) => {
    await expect(page.locator("ul.nav li")).toHaveCount(0);
  });

  test("throws no uncaught errors during render", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    // Async render rejections (e.g. a component throwing in a phase) surface as
    // console errors, NOT pageerror — capture both, or a crash slips through.
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});

/**
 * M6 — the login form submits: fields two-way-bind, `onSubmitFromLoginForm`
 * calls the generated `authenticate` operation (mock backend), and a bad-
 * credentials failure is shown via `<t:errors/>`. (Post-login navigation to
 * Search awaits the Grid component.)
 */
test.describe("M6 — Signin login (form submit → authenticate)", () => {
  test("bad credentials show an error via <t:errors/>", async ({ page }) => {
    await page.goto("/"); // redirects to /signin
    await page.locator("input[name=username]").fill("JohnDoe");
    // The "password" macro (registered in main.ts) now requires minlength=6 —
    // use a wrong-but-valid-length password so client validation passes and
    // the submit reaches the backend, which rejects the credentials.
    await page.locator("input[name=password]").fill("wrongpw");
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toHaveText(["Invalid username or password"]);
    await expect(page).toHaveURL(/\/signin$/);
    // Parity with Tapestry 5.3.8: the summary is a red banner box, not a bare
    // message. The Errors component renders DIV.t-error > DIV.t-banner, which the
    // app stylesheet (DIV.t-error DIV) paints solid #E93D00.
    const banner = page.locator(".t-error > .t-banner");
    await expect(banner).toHaveText("You must correct the following errors before continuing.");
    await expect(banner).toHaveCSS("background-color", "rgb(233, 61, 0)");
  });
});

/**
 * The View page: activation-context id → generated `getHotel` → BeanDisplay
 * property list, with the `<p:stars>` block overriding the `stars` property to
 * render HotelClass. From the unmodified View.tml.
 */
test.describe("View — BeanDisplay + HotelClass from getHotel", () => {
  test("renders the hotel's properties by activation-context id", async ({ page }) => {
    await page.goto("/view/2");
    await expect(page.locator("h2")).toHaveText("Hotel details");
    await expect(page.locator("dl.t-beandisplay")).toContainText("Hilton Downtown");
    await expect(page.locator("dl.t-beandisplay")).toContainText("Chicago");
  });

  test("the <p:stars> block renders HotelClass stars (not the raw value)", async ({ page }) => {
    await page.goto("/view/2");
    // HotelClass.tml renders <dd class="stars"><img src="/static/N-star.gif" alt="N Stars"/></dd>
    const starImg = page.locator(".stars img");
    await expect(starImg).toHaveAttribute("src", "/static/5-star.gif");
    await expect(starImg).toHaveAttribute("alt", "5 Stars");
  });
});

/**
 * The Search page (unmodified Search.tml): a Grid (include + `add` columns,
 * `p:<col>Cell` blocks, ValueEncoder-style `context="currentHotel"`), a `Select`,
 * a `message:` empty text, and a `t:zone` form that filters the results in place.
 * Logging in redirects here.
 */
test.describe("Search — Grid + form→zone + post-login redirect", () => {
  test("renders the results grid from the unmodified Search.tml", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("h2")).toHaveText("Search an Hotel");
    await expect(page.locator("#result table.t-data-grid thead th")).toHaveText([
      "Name",
      "Address",
      "Zip",
      "City State",
      "Action",
    ]);
    await expect(page.locator("#result table.t-data-grid tbody tr")).toHaveCount(2);
    await expect(page.locator("#result table.t-data-grid tbody tr").first()).toContainText("Atlanta, GA");
    await expect(page.getByRole("link", { name: "Details" }).first()).toHaveAttribute("href", "/view/1");
  });

  test("the search form filters the results zone in place (Ajax)", async ({ page }) => {
    await page.goto("/search");
    await page.locator("input[name=query]").fill("hil");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("#result table.t-data-grid tbody tr")).toHaveCount(1);
    await expect(page.locator("#result table.t-data-grid tbody tr").first()).toContainText("Hilton Downtown");
  });

  test("login redirects to Search and shows the authenticated nav", async ({ page }) => {
    await page.goto("/"); // → /signin
    await page.locator("input[name=username]").fill("JohnDoe");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.locator("ul.nav li")).toHaveCount(4);
    await expect(page.locator("#result table.t-data-grid")).toBeAttached();
    await expect(page.locator("#logout")).toBeAttached(); // actionlink informal id applied
  });
});

/**
 * The Book page (unmodified Book.tml): a `<t:delegate to="step">` multi-step
 * wizard over two `<t:block>`s. View's "Book this Hotel" form starts a booking in
 * the session workspace and navigates here; the booking form (bookBlock) has
 * DateFields, Selects (incl. an inferred-model creditCardType), and a smoking
 * RadioGroup; submitting advances to the confirmation step (confirmBlock);
 * confirming returns to Search.
 */
test.describe("Book — <t:block>/<t:delegate> multi-step booking wizard", () => {
  test("View → Book starts a booking and renders the booking form (bookBlock)", async ({ page }) => {
    await page.goto("/view/1");
    await expect(page.locator("h2")).toHaveText("Hotel details");

    await page.locator('input[value="Book this Hotel"]').click();
    await expect(page).toHaveURL(/\/book\/1$/);
    // The Book page also renders the <t:workspace/> "Booking in progress" panel
    // (a booking is now in progress), so scope to the page heading.
    await expect(page.getByRole("heading", { name: "Book hotel room" })).toBeVisible();

    // The hotel beandisplay (t:object="booking.hotel") is always shown.
    await expect(page.locator("dl.t-beandisplay").first()).toContainText("Marriott Courtyard");

    // bookBlock form: two DateFields, the roomPreference Select model, and the
    // smoking RadioGroup (defaulting to "false" = nosmoke checked).
    await expect(page.locator("form.full-form input[type=date]")).toHaveCount(2);
    await expect(page.locator("select[name=roomPreference] option")).toHaveText([
      "One king-sized bed",
      "Two double beds",
      "Three beds",
    ]);
    await expect(page.locator("input[type=radio][name=smoking]")).toHaveCount(2);
    await expect(page.locator("input[name=smoking][value=false]")).toBeChecked();
    // Bodyless <t:label> resolves the ported <fieldId>-label messages (Book.properties).
    await expect(page.locator('label[for=smoke]')).toHaveText("Smoking");
    await expect(page.locator('label[for=nosmoke]')).toHaveText("No Smoking");
    // creditCardType Select has no t:model — the <id>Model fallback supplies it.
    await expect(page.locator("select[name=creditCardType] option")).toHaveText([
      "VISA",
      "MasterCard",
      "AMEX",
      "Discover",
    ]);
  });

  test("submitting the booking form advances to confirmation, and confirming returns to Search", async ({ page }) => {
    await page.goto("/view/1");
    await page.locator('input[value="Book this Hotel"]').click();
    await expect(page).toHaveURL(/\/book\/1$/);

    await page.locator("input[name=creditCardNumber]").fill("4111111111111111");
    await page.locator('input[value="Book"]').click();

    // confirmBlock: the booking-details beandisplay masks the card, and a
    // Confirm button appears.
    await expect(page.locator('input[value="Confirm"]')).toBeVisible();
    await expect(page.locator("dl.t-beandisplay").last()).toContainText("#### #### #### 1111");

    await page.locator('input[value="Confirm"]').click();
    await expect(page).toHaveURL(/\/search$/);
  });

  test("cancelling the booking returns to Search", async ({ page }) => {
    await page.goto("/view/1");
    await page.locator('input[value="Book this Hotel"]').click();
    await expect(page).toHaveURL(/\/book\/1$/);

    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/search$/);
  });
});

/**
 * The Signup page (unmodified Signup.tml) uses the tapestry-kaptcha components
 * `<t:kaptchaimage>` / `<t:kaptchafield>`. Since Qloom is browser-only, the
 * challenge is generated and verified behind the API (mock backend): the image
 * is an SVG data-URI carrying the text, the answer stays server-side, and the
 * submit handler verifies the typed value via the generated client.
 */
async function readCaptchaAnswer(page: import("@playwright/test").Page): Promise<string> {
  const img = page.locator('img[alt="captcha challenge"]');
  await expect(img).toHaveAttribute("src", /^data:image\/svg/); // wait for the async fetch
  const src = (await img.getAttribute("src")) ?? "";
  const svg = decodeURIComponent(src.replace(/^data:image\/svg\+xml,/, ""));
  return svg.match(/<text[^>]*>([^<]+)<\/text>/)?.[1] ?? "";
}

test.describe("Signup — Kaptcha via the API (unmodified Signup.tml)", () => {
  test("renders the register form with the kaptcha field + image", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("form.full-form")).toBeAttached();
    await expect(page.locator("input[name=fcaptcha]")).toBeAttached();
    await expect(page.locator('img[alt="captcha challenge"]')).toBeAttached();
  });

  test("a correct captcha answer proceeds to Signin", async ({ page }) => {
    await page.goto("/signup");
    const answer = await readCaptchaAnswer(page);
    // username/fullname/email are now required (@Validate), and
    // password/verifyPassword must meet the "password" macro's minlength=6.
    await page.locator("input[name=username]").fill("newuser");
    await page.locator("input[name=fullname]").fill("New User");
    await page.locator("input[name=email]").fill("new@user.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verifyPassword]").fill("secret");
    await page.locator("input[name=fcaptcha]").fill(answer);
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("a wrong captcha answer is rejected via <t:errors/>", async ({ page }) => {
    await page.goto("/signup");
    await readCaptchaAnswer(page); // ensure the challenge has loaded
    await page.locator("input[name=username]").fill("newuser");
    await page.locator("input[name=fullname]").fill("New User");
    await page.locator("input[name=email]").fill("new@user.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verifyPassword]").fill("secret");
    await page.locator("input[name=fcaptcha]").fill("WRONG"); // 'O' is never in the alphabet
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toHaveText([
      "The text you typed does not match the image",
    ]);
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("mismatched passwords are rejected before the captcha check", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("input[name=username]").fill("newuser");
    await page.locator("input[name=fullname]").fill("New User");
    await page.locator("input[name=email]").fill("new@user.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verifyPassword]").fill("sekret");
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toHaveText(["Passwords are not the same"]);
  });

  test("an empty captcha shows the ported fcaptcha-required-message", async ({ page }) => {
    await page.goto("/signup");
    await readCaptchaAnswer(page); // ensure the challenge has loaded
    await page.locator("input[name=username]").fill("newuser");
    await page.locator("input[name=fullname]").fill("New User");
    await page.locator("input[name=email]").fill("new@user.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verifyPassword]").fill("secret");
    // leave fcaptcha empty
    await page.locator("input[type=submit]").click();
    // fcaptcha's emptiness is now a field-level `required` validator (not a
    // form-summary error): it's the only invalid field, so it's focused and
    // its popup carries the message (the ported fcaptcha-required-message).
    await expect(page.locator("input[name=fcaptcha]")).toHaveClass(/t-error/);
    await expect(page.locator("input[name=fcaptcha]")).toBeFocused();
    await expect(
      page.locator(".t-error-popup", {
        hasText: "Please fill this field with the String displayed inside the image below",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

/**
 * Search's `criteria` is `@SessionState` (as in the Java): a session-scoped
 * object that survives navigation. Before the fix it was a plain `@Property`, so
 * returning to Search reset the query to empty (showing all hotels) and lost the
 * search term. The SSO is also persisted to sessionStorage encrypted.
 */
test.describe("Search — @SessionState retains criteria across navigation", () => {
  async function loginAndSearch(page: import("@playwright/test").Page): Promise<void> {
    await page.goto("/");
    await page.locator("input[name=username]").fill("JohnDoe");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/search$/);
    await page.locator("input[name=query]").fill("hil");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("#result table.t-data-grid tbody tr")).toHaveCount(1);
  }

  test("the search term survives navigating away and back", async ({ page }) => {
    await loginAndSearch(page);
    // Leave Search for Settings, then return — via nav links (SPA, no reload).
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByRole("link", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/search$/);
    // Retained: the box still holds "hil" and the grid is still filtered.
    await expect(page.locator("input[name=query]")).toHaveValue("hil");
    await expect(page.locator("#result table.t-data-grid tbody tr")).toHaveCount(1);
    await expect(page.locator("#result table.t-data-grid tbody tr").first()).toContainText("Hilton");
  });

  test("the criteria is persisted to sessionStorage encrypted (not plaintext)", async ({ page }) => {
    await loginAndSearch(page);
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("qloom:sso")))
      .not.toBeNull(); // the debounced encrypt has flushed
    const raw = await page.evaluate(() => sessionStorage.getItem("qloom:sso"));
    expect(raw).not.toContain("hil"); // encrypted at rest — no plaintext query
    expect(raw).toMatch(/^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/); // iv.ciphertext (base64.base64)
  });
});

/**
 * Logout invalidates the session (Tapestry: session invalidation): the Layout
 * "Log out" actionlink logs out and clears session-scoped state (SSOs +
 * `@Persist('session')`), then returns to Signin.
 */
test.describe("Logout — session invalidation clears state", () => {
  test("logging out clears the session-state blob and returns to Signin", async ({ page }) => {
    await page.goto("/");
    await page.locator("input[name=username]").fill("JohnDoe");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/search$/);
    await page.locator("input[name=query]").fill("hil");
    await page.locator("input[type=submit]").click();
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("qloom:sso")))
      .not.toBeNull(); // session state was written

    await page.locator("#logout").click();
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.locator("ul.nav li")).toHaveCount(0); // logged out → nav hidden
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("qloom:sso")))
      .toBeNull(); // session state cleared on logout
  });
});

/**
 * The Settings page uses an *implicit* Form (`<form t:id="settingsForm">` with no
 * `t:type`) and checks the two passwords match, showing a mismatch via `<t:errors/>`.
 */
test.describe("Settings — implicit <form> component", () => {
  test("renders the settings form (implicit Form + two password fields)", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("form.full-form")).toBeAttached();
    await expect(page.locator("input[type=password]")).toHaveCount(2);
  });

  test("mismatched passwords show an error", async ({ page }) => {
    await page.goto("/settings");
    await page.locator("input[name=password]").fill("abc123");
    await page.locator("input[name=verifyPassword]").fill("different");
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toHaveText(["Passwords do not match"]);
  });
});
