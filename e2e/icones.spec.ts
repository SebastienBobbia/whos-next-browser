import { dataUrlFile, expect, row, seedTeam, solidPng, startDaily, test, tile } from "./fixtures";

const imageInput = (panel: import("@playwright/test").Page) =>
  panel.locator('input[type=file][accept*="image"]');

async function storedImages(panel: import("@playwright/test").Page): Promise<string[]> {
  return panel.evaluate(async () =>
    Object.keys(await chrome.storage.local.get(null)).filter((k) => k.startsWith("image:")),
  );
}

test("propose les 64 emojis et montre l'Icône actuelle (IC-01, IC-02, IC-03)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Camille", icon: { type: "emoji", value: "🦊" } }]);
  await row(panel, "Camille").locator(".icon-btn").click();
  const dialog = panel.getByRole("dialog", { name: "Icône — Camille" });
  await expect(dialog.getByRole("heading")).toHaveText("Icône — Camille");
  await expect(dialog.locator(".cell")).toHaveCount(64);
  await expect(dialog.locator(".cell").first()).toHaveText("😀");
  await expect(dialog.locator(".cell.selected")).toHaveText("🦊");
  await expect(dialog.locator(".file-name")).toHaveText("Aucun fichier");
});

test("sélectionne, désélectionne et applique un emoji, enregistré tout de suite (IC-04, IC-06, IC-10)", async ({
  panel,
}) => {
  await seedTeam(panel, [{ name: "Camille" }]);
  await row(panel, "Camille").locator(".icon-btn").click();
  await panel.getByRole("button", { name: "🐱" }).click();
  await panel.getByRole("button", { name: "🐱" }).click();
  await expect(panel.locator(".cell.selected")).toHaveCount(0);
  await panel.getByRole("button", { name: "🐼" }).click();
  await panel.getByRole("button", { name: "Valider" }).click();

  await expect(row(panel, "Camille").locator(".icon-btn")).toHaveText("🐼");
  await panel.reload();
  await expect(row(panel, "Camille").locator(".icon-btn")).toHaveText("🐼");
});

test("importe une image, nom coupé au-delà de 28 caractères, emoji désélectionné (IC-05, IC-11)", async ({
  panel,
}) => {
  await seedTeam(panel, [{ name: "Camille", icon: { type: "emoji", value: "🐱" } }]);
  const png = await solidPng(panel, "#3366cc");
  await row(panel, "Camille").locator(".icon-btn").click();
  await imageInput(panel).setInputFiles(dataUrlFile("une-photo-au-nom-vraiment-tres-long.png", png));

  await expect(panel.locator(".file-name")).toHaveText("une-photo-au-nom-vraiment…");
  await expect(panel.locator(".cell.selected")).toHaveCount(0);
  await panel.getByRole("button", { name: "Valider" }).click();
  await expect(row(panel, "Camille").locator("img")).toBeVisible();

  // Le nom d'origine est gardé, pour l'affichage (IC-03, IC-11).
  await row(panel, "Camille").locator(".icon-btn").click();
  await expect(panel.locator(".file-name")).toHaveText("une-photo-au-nom-vraiment…");
  expect(await storedImages(panel)).toHaveLength(1);
});

test("valider sans rien changer garde l'image (IC-07)", async ({ panel }) => {
  const png = await solidPng(panel, "#cc3333");
  await seedTeam(panel, [{ name: "Camille", icon: { type: "image", id: "photo", file: "c.png" } }], { photo: png });
  await row(panel, "Camille").locator(".icon-btn").click();
  await panel.getByRole("button", { name: "Valider" }).click();
  await expect(row(panel, "Camille").locator("img")).toBeVisible();
  expect(await storedImages(panel)).toEqual(["image:photo"]);
});

test("Annuler et Échap ne changent rien (IC-08)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Camille", icon: { type: "emoji", value: "🐱" } }]);
  await row(panel, "Camille").locator(".icon-btn").click();
  await panel.getByRole("button", { name: "🐼" }).click();
  await panel.getByRole("button", { name: "Annuler" }).click();
  await row(panel, "Camille").locator(".icon-btn").click();
  await panel.getByRole("button", { name: "🐼" }).click();
  await panel.keyboard.press("Escape");
  await expect(panel.getByRole("dialog")).toHaveCount(0);
  await expect(row(panel, "Camille").locator(".icon-btn")).toHaveText("🐱");
});

test("supprime l'Icône et son image tout de suite (IC-09, IC-12, PE-09)", async ({ panel }) => {
  const png = await solidPng(panel, "#cc3333");
  await seedTeam(panel, [{ name: "Camille", icon: { type: "image", id: "photo", file: "c.png" } }], { photo: png });
  await row(panel, "Camille").locator(".icon-btn").click();
  await panel.getByRole("button", { name: "Supprimer l'icône" }).click();
  await expect(panel.getByRole("dialog")).toHaveCount(0);
  await expect(row(panel, "Camille").locator("img")).toHaveCount(0);
  await expect.poll(() => storedImages(panel)).toEqual([]);
});

test("un SVG sans dimensions s'affiche partout et teinte sa Tuile (IC-14, IC-15, SE-15)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Camille" }, { name: "Marion" }]);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#3366cc"/></svg>';
  await row(panel, "Camille").locator(".icon-btn").click();
  await imageInput(panel).setInputFiles({ name: "camille.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg) });
  await panel.getByRole("button", { name: "Valider" }).click();
  await expect(row(panel, "Camille").locator("img")).toBeVisible();

  await startDaily(panel);
  await expect(tile(panel, "Camille").locator("img")).toBeVisible();
  // #3366cc assombri de 40 % ; Marion, sans image, garde la couleur par défaut (IC-16).
  await expect(tile(panel, "Camille")).toHaveCSS("background-color", "rgb(31, 61, 122)");
  await expect(tile(panel, "Marion")).toHaveCSS("background-color", "rgb(45, 45, 68)");
});

test("réduit une grande image à l'import (IC-17)", async ({ panel }) => {
  await seedTeam(panel, [{ name: "Camille" }]);
  const big = await solidPng(panel, "#33aa66", 2000);
  await row(panel, "Camille").locator(".icon-btn").click();
  await imageInput(panel).setInputFiles(dataUrlFile("grande.png", big));
  await panel.getByRole("button", { name: "Valider" }).click();
  await expect(row(panel, "Camille").locator("img")).toBeVisible();

  const size = await panel.evaluate(async () => {
    const stored = await chrome.storage.local.get(null);
    const url = Object.entries(stored).find(([k]) => k.startsWith("image:"))![1] as string;
    const image = new Image();
    image.src = url;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight, length: url.length };
  });
  expect(size.width).toBeLessThanOrEqual(512);
  expect(size.height).toBeLessThanOrEqual(512);
  expect(size.length).toBeLessThan(big.length);
});
