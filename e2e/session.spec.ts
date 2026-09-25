import type { Page } from "@playwright/test";
import { expect, openPanel, seedTeam, solidPng, startDaily, test, tile } from "./fixtures";

const TEAM = [
  { name: "Adeline", icon: { type: "image" as const, id: "photo", file: "a.png" } },
  { name: "Camille", icon: { type: "emoji" as const, value: "🦄" } },
  { name: "Marion" },
  { name: "Yoann" },
];

const tileNames = (panel: Page) => panel.locator(".tile .name");

async function start(panel: Page, absent: string[] = []) {
  await seedTeam(panel, TEAM, { photo: await solidPng(panel, "#cc3333") });
  await startDaily(panel, absent);
}

test("affiche une Tuile par Restant, dans l'ordre, avec son Icône (SE-01, SE-02, SE-11, SE-13, SE-15)", async ({
  panel,
}) => {
  await start(panel, ["Yoann"]);
  await expect(tileNames(panel)).toHaveText(["Adeline", "Camille", "Marion"]);
  await expect(tile(panel, "Adeline").locator("img")).toBeVisible();
  await expect(tile(panel, "Camille").locator(".emoji")).toHaveText("🦄");
  await expect(tile(panel, "Marion").locator(".initial")).toHaveText("M");
  // #cc3333 assombri de 40 % ; sans image, la couleur par défaut.
  await expect(tile(panel, "Adeline")).toHaveCSS("background-color", "rgb(122, 31, 31)");
  await expect(tile(panel, "Camille")).toHaveCSS("background-color", "rgb(45, 45, 68)");
  await expect(panel.locator("nav button")).toHaveCount(3);
  await expect(panel.locator(".session nav").getByTitle(/Recaler/)).toHaveCount(0);
});

test("retire la Tuile cliquée et efface le Désigné (SE-03)", async ({ panel }) => {
  await start(panel);
  await panel.getByTitle("Tirage au sort").click();
  await expect(panel.locator(".tile.designated")).toHaveCount(1);
  const designated = await panel.locator(".tile.designated .name").textContent();
  const other = ["Adeline", "Camille", "Marion", "Yoann"].find((n) => n !== designated)!;
  await tile(panel, other).locator("button").click();
  await expect(tileNames(panel)).not.toContainText([other]);
  await expect(panel.locator(".tile.designated")).toHaveCount(0);
});

test("tire un autre Restant que le Désigné, et se désactive quand il ne reste que lui (SE-04, SE-05, SE-06)", async ({
  panel,
}) => {
  await start(panel, ["Marion", "Yoann"]);
  const draw = panel.getByTitle("Tirage au sort");
  await draw.click();
  const first = await panel.locator(".tile.designated .name").textContent();
  await expect(panel.locator(".tile.designated")).toHaveClass(/flash/);
  await draw.click();
  await expect(panel.locator(".tile.designated .name")).not.toHaveText(first!);

  const designated = await panel.locator(".tile.designated .name").textContent();
  const other = designated === "Adeline" ? "Camille" : "Adeline";
  await tile(panel, other).locator("button").click();
  await draw.click();
  await expect(draw).toBeDisabled();
});

test("garde le Désigné visible après un redimensionnement et une réouverture (SE-06, SE-16, SE-17)", async ({
  panel,
}) => {
  await start(panel);
  await panel.getByTitle("Tirage au sort").click();
  const designated = await panel.locator(".tile.designated .name").textContent();

  await panel.setViewportSize({ width: 300, height: 500 });
  await expect(panel.locator(".tile.designated .name")).toHaveText(designated!);

  await panel.reload();
  await expect(panel.locator(".tile.designated .name")).toHaveText(designated!);
  await expect(tileNames(panel)).toHaveText(["Adeline", "Camille", "Marion", "Yoann"]);
});

test("annule le Désigné, puis les prises de parole (SE-07, SE-08)", async ({ panel }) => {
  await start(panel);
  const undo = panel.getByTitle("Annuler");
  await expect(undo).toBeDisabled();

  await panel.getByTitle("Tirage au sort").click();
  await expect(undo).toBeEnabled();
  await undo.click();
  await expect(panel.locator(".tile.designated")).toHaveCount(0);
  await expect(undo).toBeDisabled();

  await tile(panel, "Camille").locator("button").click();
  await tile(panel, "Adeline").locator("button").click();
  await undo.click();
  await expect(tileNames(panel)).toHaveText(["Adeline", "Marion", "Yoann"]);
  await undo.click();
  await expect(tileNames(panel)).toHaveText(["Adeline", "Camille", "Marion", "Yoann"]);
  await expect(undo).toBeDisabled();
});

test("termine la Session sans confirmation et revient à l'Équipe (SE-09)", async ({ panel }) => {
  await start(panel);
  await panel.getByTitle("Terminer").click();
  await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
  await panel.reload();
  await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
});

test("affiche la Célébration, puis revient à l'Équipe après 3 secondes (SE-10)", async ({ panel }) => {
  await start(panel, ["Camille", "Marion", "Yoann"]);
  await tile(panel, "Adeline").locator("button").click();
  await expect(panel.locator(".celebration")).toContainText("a parlé");
  await expect(panel.getByTitle("Tirage au sort")).toBeDisabled();
  await expect(panel.getByTitle("Annuler")).toBeDisabled();

  const shown = Date.now();
  await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible({ timeout: 6000 });
  expect(Date.now() - shown).toBeGreaterThan(2500);
});

test("montre tous les Restants sans défilement, en compact quand ils sont trop bas (SE-12, SE-14, SE-16)", async ({
  panel,
}) => {
  const many = Array.from({ length: 12 }, (_, i) => ({ name: `Membre ${i + 1}` }));
  await seedTeam(panel, many);
  await startDaily(panel);
  const list = panel.locator(".tiles");
  const fits = () => list.evaluate((el) => el.scrollHeight <= el.clientHeight);

  await expect(panel.locator(".tile.compact")).toHaveCount(0);
  expect(await fits()).toBe(true);

  await panel.setViewportSize({ width: 340, height: 400 });
  await expect(panel.locator(".tile.compact")).toHaveCount(12);
  await expect(panel.locator(".tile .name")).toHaveCount(0);
  await expect(panel.locator(".tile .initial").first()).toHaveText("M");
  expect(await fits()).toBe(true);

  await panel.setViewportSize({ width: 340, height: 900 });
  await expect(panel.locator(".tile.compact")).toHaveCount(0);
});

test("partage la Session entre deux panneaux (SE-18)", async ({ panel, context, errors }) => {
  await start(panel);
  const other = await openPanel(context, errors);
  await expect(other.locator(".tile .name")).toHaveText(["Adeline", "Camille", "Marion", "Yoann"]);

  await tile(other, "Camille").locator("button").click();
  await expect(tileNames(panel)).toHaveText(["Adeline", "Marion", "Yoann"]);
  await panel.getByTitle("Terminer").click();
  await expect(other.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
});

test("met le panneau à jour moins de 50 ms après le clic sur une Tuile (PF-02, LI-14)", async ({ panel }) => {
  await start(panel);
  const elapsed = await panel.evaluate(async () => {
    const button = document.querySelector<HTMLButtonElement>(".tile button")!;
    const count = document.querySelectorAll(".tile").length;
    const start = performance.now();
    button.click();
    while (document.querySelectorAll(".tile").length === count) await new Promise(requestAnimationFrame);
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(50);
});

test("tire au sort en moins de 100 ms (PF-05)", async ({ panel }) => {
  await start(panel);
  const elapsed = await panel.evaluate(async () => {
    const button = document.querySelector<HTMLButtonElement>('[title="Tirage au sort"]')!;
    const start = performance.now();
    button.click();
    while (!document.querySelector(".tile.designated")) await new Promise(requestAnimationFrame);
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(100);
});
