import { test, expect } from "@playwright/test";

test("lists films from the generated GraphQL client (Right path)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Star Wars Films" })).toBeVisible();
  const films = page.getByTestId("film");
  await expect(films).toHaveCount(3);
  await expect(films.first()).toContainText("A New Hope");
  await expect(page.getByTestId("error")).toHaveCount(0);
});

test("GetFilm error resolves to Left and surfaces the message", async ({ page }) => {
  await page.goto("/");
  const message = await page.evaluate(async () => {
    const mod = await import("/dal/Swapi.ts");
    const result = await mod.swapiApi.GetFilm({ id: "999" });
    return result.fold((err: { message: string }) => err.message, () => "OK");
  });
  expect(message).toMatch(/No film with id 999/);
});
