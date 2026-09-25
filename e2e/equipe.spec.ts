import { expect, row, seedTeam, test } from "./fixtures";

const names = (panel: import("@playwright/test").Page) => panel.locator(".row .name");

test("affiche une Équipe vide au premier lancement, avec l'import proposé (EQ-01, EQ-06, EQ-19, PE-13, FI-01)", async ({
  panel,
}) => {
  await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
  await expect(panel.locator(".empty")).toHaveText(
    "Aucun membre. Ajoutez des personnes ci-dessus ou importez un Fichier d'Équipe.",
  );
  await expect(panel.locator(".hint")).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Importer" })).toBeEnabled();
  await expect(panel.getByRole("button", { name: "Exporter" })).toBeDisabled();
  await expect(panel.getByRole("button", { name: /Préparer le Daily/ })).toBeDisabled();
});

test("ajoute à la fin, sans les espaces autour, et vide le champ (EQ-05, EQ-07, EQ-08, EQ-16)", async ({ panel }) => {
  const field = panel.getByPlaceholder("Nom du membre...");
  await field.fill("  Camille  ");
  await field.press("Enter");
  await field.fill("Adeline");
  await panel.getByRole("button", { name: "Ajouter" }).click();

  await expect(names(panel)).toHaveText(["1. Camille", "2. Adeline"]);
  await expect(field).toHaveValue("");
  await expect(panel.locator(".count")).toHaveText("2 membres dans l'équipe");
  await expect(panel.locator(".hint")).toHaveText("Maintenir et glisser pour réordonner");

  await panel.reload();
  await expect(names(panel)).toHaveText(["1. Camille", "2. Adeline"]);
});

test("refuse un nom vide ou en double, et garde le message jusqu'au prochain ajout (EQ-09, EQ-10, EQ-11)", async ({
  panel,
}) => {
  const field = panel.getByPlaceholder("Nom du membre...");
  const add = panel.getByRole("button", { name: "Ajouter" });
  await field.fill("Loïc");
  await add.click();

  await field.fill("   ");
  await add.click();
  await expect(panel.locator(".error")).toHaveText("Veuillez entrer un nom.");

  await field.fill("LOÏC");
  await add.click();
  await expect(panel.locator(".error")).toHaveText('"LOÏC" existe déjà dans l\'équipe.');
  await expect(names(panel)).toHaveText(["1. Loïc"]);

  await field.fill("Loic");
  await add.click();
  await expect(panel.locator(".error")).toHaveCount(0);
  await expect(names(panel)).toHaveText(["1. Loïc", "2. Loic"]);
});

test("montre l'état de l'Icône et du Lien sur chaque ligne (EQ-02, EQ-03, EQ-04, IC-13)", async ({ panel }) => {
  await seedTeam(
    panel,
    [
      { name: "Camille", icon: { type: "emoji", value: "🦄" } },
      { name: "Marion", icon: { type: "image", id: "abimee", file: "marion.png" } },
      { name: "Yoann", link: "https://jira.entreprise.com/" },
    ],
    // Image illisible : la ligne s'affiche sans image et sans erreur.
    { abimee: "data:image/png;base64,AAAA" },
  );
  await expect(row(panel, "Camille").locator(".icon-btn")).toHaveText("🦄");
  await expect(row(panel, "Marion").locator(".icon-btn svg")).toHaveCount(1);
  await expect(row(panel, "Marion").locator("img")).toHaveCount(0);
  await expect(row(panel, "Yoann").locator(".icon-btn svg")).toHaveCount(1);

  await expect(row(panel, "Camille").locator(".link-btn")).not.toHaveClass(/set/);
  await expect(row(panel, "Yoann").locator(".link-btn")).toHaveClass(/set/);
  await expect(row(panel, "Yoann").locator("button")).toHaveCount(3);
});

test("supprime un Membre sans confirmation et renumérote (EQ-12)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Adeline" }, { name: "Camille" }, { name: "Marion" }]);
  await row(panel, "Camille").getByTitle("Supprimer").click();
  await expect(names(panel)).toHaveText(["1. Adeline", "2. Marion"]);
  await panel.reload();
  await expect(names(panel)).toHaveText(["1. Adeline", "2. Marion"]);
});

test("réordonne par glisser-déposer (EQ-13, EQ-14)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Adeline" }, { name: "Camille" }, { name: "Marion" }]);

  // Relâchée sur la moitié basse de la dernière ligne : Adeline passe à la fin.
  await row(panel, "Adeline").locator(".handle").dragTo(row(panel, "Marion"), {
    targetPosition: { x: 60, y: 32 },
  });
  await expect(names(panel)).toHaveText(["1. Camille", "2. Marion", "3. Adeline"]);

  // Relâchée à sa place : rien ne bouge.
  await row(panel, "Marion").locator(".handle").dragTo(row(panel, "Marion"), {
    targetPosition: { x: 60, y: 8 },
  });
  await expect(names(panel)).toHaveText(["1. Camille", "2. Marion", "3. Adeline"]);

  await panel.reload();
  await expect(names(panel)).toHaveText(["1. Camille", "2. Marion", "3. Adeline"]);
});

test("ne réordonne pas depuis les boutons d'une ligne, qui gardent leur action (EQ-15)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Adeline" }, { name: "Camille" }]);
  for (const button of [".icon-btn", ".link-btn", ".del-btn"]) {
    await row(panel, "Adeline").locator(button).dragTo(row(panel, "Camille"), {
      targetPosition: { x: 60, y: 32 },
    });
    await expect(names(panel)).toHaveText(["1. Adeline", "2. Camille"]);
  }
  await row(panel, "Adeline").locator(".icon-btn").click();
  await expect(panel.getByRole("dialog", { name: "Icône — Adeline" })).toBeVisible();
});

test("ouvre la vue Présence (EQ-17, EQ-18)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Adeline" }]);
  await row(panel, "Adeline").locator(".icon-btn").click();
  await expect(panel.getByRole("dialog", { name: "Icône — Adeline" })).toBeVisible();
  await panel.keyboard.press("Escape");

  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  await expect(panel.getByRole("heading", { name: "Qui est présent ?" })).toBeVisible();
});

test("réagit à un ajout en moins de 100 ms (PF-05)", async ({ panel }) => {
  await panel.getByPlaceholder("Nom du membre...").fill("Camille");
  const elapsed = await panel.evaluate(async () => {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent === "Ajouter")!;
    const start = performance.now();
    button.click();
    while (!document.querySelector(".row")) await new Promise(requestAnimationFrame);
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(100);
});
