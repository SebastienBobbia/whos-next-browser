import type { Page } from "@playwright/test";
import { expect, openPanel, seedTeam, solidPng, test } from "./fixtures";

const TEAM = [
  { name: "Adeline" },
  { name: "Camille", icon: { type: "image" as const, id: "photo", file: "c.png" } },
  { name: "Marion" },
  { name: "Yoann", absent: true },
];

const box = (panel: Page, name: string) => panel.locator("label", { hasText: name }).locator("input");

async function openPresence(panel: Page) {
  await seedTeam(panel, TEAM, { photo: await solidPng(panel, "#cc3333") });
  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  await expect(panel.getByRole("heading", { name: "Qui est présent ?" })).toBeVisible();
}

test("liste l'Équipe dans l'ordre, Absents décochés (PR-01, PR-02, PR-03, PR-04)", async ({ panel }) => {
  await openPresence(panel);
  await expect(panel.locator(".row .name")).toHaveText(["Adeline", "Camille", "Marion", "Yoann"]);
  await expect(panel.locator(".row", { hasText: "Camille" }).locator("img")).toBeVisible();
  expect(await Promise.all(TEAM.map((m) => box(panel, m.name).isChecked()))).toEqual([true, true, true, false]);
});

test("compte les présents et coche ou décoche tout (PR-05, PR-06)", async ({ panel }) => {
  await openPresence(panel);
  await expect(panel.locator(".count")).toHaveText("3/4 présents");
  await box(panel, "Marion").uncheck();
  await expect(panel.locator(".count")).toHaveText("2/4 présents");
  await panel.getByRole("button", { name: "Tout cocher" }).click();
  await expect(panel.locator(".count")).toHaveText("4/4 présents");
  await panel.getByRole("button", { name: "Tout décocher" }).click();
  await expect(panel.locator(".count")).toHaveText("0/4 présents");
  await expect(panel.getByRole("button", { name: /Démarrer le Daily/ })).toBeDisabled();
});

test("revient à l'Équipe sans rien enregistrer (PR-07)", async ({ panel }) => {
  await openPresence(panel);
  await box(panel, "Adeline").uncheck();
  await panel.getByRole("button", { name: "Retour" }).click();
  await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  await expect(box(panel, "Adeline")).toBeChecked();
});

test("lance la Session avec les cochés, dans l'ordre de l'Équipe, et enregistre les Absents (PR-08, PR-09)", async ({
  panel,
}) => {
  await openPresence(panel);
  await box(panel, "Marion").uncheck();
  await box(panel, "Yoann").check();
  await panel.getByRole("button", { name: /Démarrer le Daily/ }).click();
  await expect(panel.locator(".tile .name")).toHaveText(["Adeline", "Camille", "Yoann"]);

  await panel.getByTitle("Terminer").click();
  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  expect(await Promise.all(TEAM.map((m) => box(panel, m.name).isChecked()))).toEqual([true, true, false, true]);
});

test("gère une Équipe vidée depuis un autre panneau (PR-10)", async ({ panel, context, errors }) => {
  await openPresence(panel);
  const other = await openPanel(context, errors);
  for (const member of TEAM) await other.locator(".row", { hasText: member.name }).getByTitle("Supprimer").click();

  await expect(panel.getByText("Aucun membre dans l'équipe. Retournez en arrière pour en ajouter.")).toBeVisible();
  await expect(panel.getByRole("button", { name: /Démarrer le Daily/ })).toBeDisabled();
});
