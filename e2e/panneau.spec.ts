import type { Page } from "@playwright/test";
import { expect, row, seedTeam, startDaily, test } from "./fixtures";

/** Aucune vue ne défile en largeur. */
async function noHorizontalScroll(panel: Page) {
  expect(await panel.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("reste utilisable sans défilement horizontal à 300 px de large (PA-05)", async ({ panel }) => {
  await panel.setViewportSize({ width: 300, height: 640 });
  await seedTeam(panel, [
    { name: "Un nom vraiment très long pour une seule ligne", link: "https://jira.entreprise.com/" },
    { name: "Camille" },
  ]);
  await noHorizontalScroll(panel);

  await row(panel, "Camille").locator(".icon-btn").click();
  await noHorizontalScroll(panel);
  await expect(panel.getByRole("button", { name: "Valider" })).toBeInViewport();
  await panel.keyboard.press("Escape");

  await row(panel, "Camille").locator(".link-btn").click();
  await noHorizontalScroll(panel);
  await expect(panel.getByRole("button", { name: "Valider" })).toBeInViewport();
  await panel.keyboard.press("Escape");

  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  await noHorizontalScroll(panel);
  await panel.getByRole("button", { name: /Démarrer le Daily/ }).click();
  await noHorizontalScroll(panel);
});

test("utilise uniquement un thème sombre, en français (FE-02, DI-02)", async ({ panel }) => {
  await expect(panel.locator("body")).toHaveCSS("background-color", "rgb(21, 21, 43)");
  expect(await panel.evaluate(() => document.documentElement.lang)).toBe("fr");
  await panel.emulateMedia({ colorScheme: "light" });
  await expect(panel.locator("body")).toHaveCSS("background-color", "rgb(21, 21, 43)");

  await seedTeam(panel, [{ name: "Camille" }]);
  await startDaily(panel);
  await expect(panel.locator(".session")).toHaveCSS("background-color", "rgb(12, 12, 22)");
});
