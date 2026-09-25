import fs from "node:fs";
import type { Page } from "@playwright/test";
import { expect, row, seedTeam, solidPng, startDaily, test } from "./fixtures";

const LINK = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&quickFilter=5710#";

const importInput = (panel: Page) => panel.locator('input[type=file][accept*="json"]');
const names = (panel: Page) => panel.locator(".row .name");

/** Écrit un Fichier d'Équipe dans le dossier du test et renvoie son chemin. */
function teamFile(path: string, members: unknown[]): string {
  fs.writeFileSync(path, JSON.stringify({ format: "whos-next-equipe", version: 1, members }, null, 2));
  return path;
}

async function exportTeam(panel: Page, target: string) {
  const [download] = await Promise.all([
    panel.waitForEvent("download"),
    panel.getByRole("button", { name: "Exporter" }).click(),
  ]);
  await download.saveAs(target);
  return { name: download.suggestedFilename(), text: fs.readFileSync(target, "utf8") };
}

test("importe sur une Équipe vide sans confirmation (FI-04, FI-05, PE-08)", async ({ panel }, info) => {
  const png = await solidPng(panel, "#3366cc");
  const file = teamFile(info.outputPath("equipe.json"), [
    { name: "Camille", icon: { type: "image", file: "c.png", data: png }, link: LINK },
    { name: "Loïc", icon: { type: "emoji", value: "🐱" } },
  ]);
  await importInput(panel).setInputFiles(file);
  await expect(names(panel)).toHaveText(["1. Camille", "2. Loïc"]);
  await expect(panel.getByRole("alertdialog")).toHaveCount(0);
  await expect(row(panel, "Camille").locator("img")).toBeVisible();
  await expect(row(panel, "Camille").locator(".link-btn")).toHaveAttribute("title", LINK);

  await panel.reload();
  await expect(names(panel)).toHaveText(["1. Camille", "2. Loïc"]);
});

test("exporte l'Équipe complète sans les Absents, fichier daté (FI-02, FI-03)", async ({ panel }, info) => {
  const png = await solidPng(panel, "#3366cc");
  await seedTeam(
    panel,
    [
      { name: "Camille", icon: { type: "image", id: "photo", file: "c.png" }, link: LINK },
      { name: "Loïc", icon: { type: "emoji", value: "🐱" }, absent: true },
    ],
    { photo: png },
  );
  const { name, text } = await exportTeam(panel, info.outputPath("export.json"));
  expect(name).toMatch(/^whos-next-equipe-\d{8}\.json$/);
  expect(text).toContain('\n  "format": "whos-next-equipe"');
  expect(text).toContain("Loïc");
  expect(text).not.toContain("\\u");
  expect(JSON.parse(text).members).toEqual([
    { name: "Camille", icon: { type: "image", file: "c.png", data: png }, link: LINK },
    { name: "Loïc", icon: { type: "emoji", value: "🐱" } },
  ]);
});

test("refuse un fichier qui n'est pas un Fichier d'Équipe (FI-07)", async ({ panel }, info) => {
  await seedTeam(panel, [{ name: "Adeline" }]);
  const desktop = info.outputPath("team.json");
  fs.writeFileSync(desktop, JSON.stringify({ version: 2, members: [{ name: "X", icon_type: "", icon_value: "" }] }));
  await importInput(panel).setInputFiles(desktop);
  await expect(panel.getByText("Ce fichier n'est pas un Fichier d'Équipe valide.")).toBeVisible();
  await expect(names(panel)).toHaveText(["1. Adeline"]);
});

test("demande confirmation avant de remplacer une Équipe, et garde les Absents (FI-04, FI-05, FI-06, FI-08)", async ({
  panel,
}, info) => {
  await seedTeam(panel, [{ name: "Adeline" }, { name: "Quentin", absent: true }]);
  const file = teamFile(info.outputPath("equipe.json"), [
    { name: "QUENTIN" },
    { name: "Marion", link: "pas une adresse" },
    { name: "  " },
  ]);

  await importInput(panel).setInputFiles(file);
  await expect(panel.getByRole("alertdialog")).toHaveText(/Remplacer l'équipe actuelle \(2 membres\) par celle du fichier \(2 membres\) \?/);
  await panel.getByRole("button", { name: "Annuler" }).click();
  await expect(names(panel)).toHaveText(["1. Adeline", "2. Quentin"]);

  await importInput(panel).setInputFiles(file);
  await panel.getByRole("button", { name: "Remplacer" }).click();
  await expect(names(panel)).toHaveText(["1. QUENTIN", "2. Marion"]);
  await expect(row(panel, "Marion").locator(".link-btn")).not.toHaveClass(/set/);

  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  await expect(panel.locator("label", { hasText: "QUENTIN" }).locator("input")).not.toBeChecked();
  await expect(panel.locator("label", { hasText: "Marion" }).locator("input")).toBeChecked();
});

test("redonne la même Équipe après export puis import (FI-09)", async ({ panel }, info) => {
  const png = await solidPng(panel, "#3366cc");
  await seedTeam(
    panel,
    [
      { name: "Camille", icon: { type: "image", id: "photo", file: "c.png" }, link: LINK },
      { name: "Loïc", icon: { type: "emoji", value: "🐱" } },
      { name: "Marion" },
    ],
    { photo: png },
  );
  const first = await exportTeam(panel, info.outputPath("premier.json"));
  await row(panel, "Marion").getByTitle("Supprimer").click();
  await importInput(panel).setInputFiles(info.outputPath("premier.json"));
  await panel.getByRole("button", { name: "Remplacer" }).click();
  await expect(names(panel)).toHaveText(["1. Camille", "2. Loïc", "3. Marion"]);
  const second = await exportTeam(panel, info.outputPath("second.json"));
  expect(second.text).toBe(first.text);
});

test("importe 20 Membres avec images en moins d'une seconde (PF-06)", async ({ panel }, info) => {
  const members = await Promise.all(
    Array.from({ length: 20 }, async (_, i) => ({
      name: `Membre ${i + 1}`,
      icon: { type: "image", file: `m${i}.png`, data: await solidPng(panel, `hsl(${i * 18}, 60%, 50%)`, 256) },
    })),
  );
  const file = teamFile(info.outputPath("vingt.json"), members);
  const start = Date.now();
  await importInput(panel).setInputFiles(file);
  await expect(panel.locator(".row img")).toHaveCount(20);
  expect(Date.now() - start).toBeLessThan(1000);

  await startDaily(panel);
  await expect(panel.locator(".tile")).toHaveCount(20);
});
