import { test, expect } from "@playwright/test";

test("dark mode follows the system until overridden, and persists across reloads", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).colorScheme),
  ).toBe("dark");
  expect(
    await page
      .locator(".shipment-form")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(27, 37, 31)");
  await page.getByLabel("Gross weight").fill("600");
  await page
    .getByRole("button", { name: "Compare estimates", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Compare your estimates." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review estimate" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Review your booking request." }),
  ).toBeVisible();
  expect(
    await page
      .locator(".quote-request-step")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(27, 37, 31)");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(27, 37, 31)");
  expect(
    await page
      .getByLabel("Email address")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(27, 37, 31)");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dark-mode.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("a dark system preference is applied before the app mounts", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();
});
