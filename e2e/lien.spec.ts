import type { BrowserContext, Page } from "@playwright/test";
import {
  BOARD,
  BOARD_WITHOUT_FILTERS,
  CONFLUENCE,
  checkedFilters,
  expect,
  row,
  seedTeam,
  setLink,
  startDaily,
  tabs,
  test,
  tile,
} from "./fixtures";

const PIERRE_YVES = `${BOARD}&quickFilter=5710#`;
const CAMILLE = `${BOARD}&quickFilter=5711#`;
const OTHER_BOARD = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=999&projectKey=OPS";

/** Ouvre le Tableau et une page Confluence, laissée au premier plan. */
async function openTabs(context: BrowserContext): Promise<Page> {
  const jira = await context.newPage();
  await jira.goto(`${BOARD}&quickFilter=1`);
  const confluence = await context.newPage();
  await confluence.goto(CONFLUENCE);
  await confluence.bringToFront();
  return jira;
}

const activeUrl = async (panel: Page) => (await tabs(panel)).find((t) => t.active)?.url;

test.describe("fenêtre Lien", () => {
  test("montre le Lien sur la ligne et ouvre sa fenêtre (LI-01, LI-02, LI-03)", async ({ panel }) => {
    await seedTeam(panel, [{ name: "Camille" }, { name: "Pierre-Yves", link: PIERRE_YVES }]);
    await expect(row(panel, "Pierre-Yves").locator(".link-btn")).toHaveAttribute("title", PIERRE_YVES);
    await expect(row(panel, "Camille").locator(".link-btn")).toHaveAttribute("title", "Lien");

    await row(panel, "Pierre-Yves").locator(".link-btn").click();
    const dialog = panel.getByRole("dialog", { name: "Lien — Pierre-Yves" });
    await expect(dialog.locator("input")).toHaveValue(PIERRE_YVES);
    for (const name of ["Prendre l'onglet actuel", "Tester", "Supprimer le lien", "Annuler", "Valider"]) {
      await expect(dialog.getByRole("button", { name })).toBeVisible();
    }
  });

  test("prend l'adresse de l'onglet actif, seulement pour une page web (LI-04)", async ({ panel, context }) => {
    await seedTeam(panel, [{ name: "Camille" }]);
    await row(panel, "Camille").locator(".link-btn").click();
    await panel.bringToFront();
    await panel.getByRole("button", { name: "Prendre l'onglet actuel" }).click();
    await expect(panel.locator(".dialog .error")).toHaveText("Cet onglet n'affiche pas une page web.");

    const jira = await context.newPage();
    await jira.goto(CAMILLE);
    await jira.bringToFront();
    await panel.getByRole("button", { name: "Prendre l'onglet actuel" }).click();
    await expect(panel.locator(".dialog input")).toHaveValue(CAMILLE);
    await expect(panel.locator(".dialog .error")).toHaveCount(0);
  });

  test("teste l'adresse sans l'enregistrer (LI-05)", async ({ panel, context }) => {
    const jira = await openTabs(context);
    await seedTeam(panel, [{ name: "Camille" }]);
    await row(panel, "Camille").locator(".link-btn").click();
    await panel.locator(".dialog input").fill(CAMILLE);
    await panel.getByRole("button", { name: "Tester" }).click();
    await expect.poll(() => checkedFilters(jira)).toEqual(["5711"]);
    await panel.getByRole("button", { name: "Annuler" }).click();
    await expect(row(panel, "Camille").locator(".link-btn")).not.toHaveClass(/set/);
  });

  test("valide, refuse une adresse invalide et retire un Lien (LI-06, LI-07, LI-08)", async ({ panel }) => {
    await seedTeam(panel, [{ name: "Camille" }]);
    const button = row(panel, "Camille").locator(".link-btn");
    await button.click();
    await expect(panel.getByRole("button", { name: "Supprimer le lien" })).toBeDisabled();
    await panel.locator(".dialog input").fill("jira.entreprise.com/secure/RapidBoard.jspa");
    await panel.getByRole("button", { name: "Valider" }).click();
    await expect(panel.locator(".dialog .error")).toHaveText(
      "Adresse invalide : elle doit commencer par http:// ou https://.",
    );

    await panel.locator(".dialog input").fill(`  ${CAMILLE}  `);
    await panel.locator(".dialog input").press("Enter");
    await expect(button).toHaveAttribute("title", CAMILLE);
    await panel.reload();
    await expect(button).toHaveAttribute("title", CAMILLE);

    await button.click();
    await panel.locator(".dialog input").fill("https://ailleurs.example/");
    await panel.keyboard.press("Escape");
    await expect(button).toHaveAttribute("title", CAMILLE);

    await button.click();
    await panel.getByRole("button", { name: "Supprimer le lien" }).click();
    await expect(button).not.toHaveClass(/set/);

    await setLink(panel, "Camille", CAMILLE);
    await button.click();
    await panel.locator(".dialog input").fill("   ");
    await panel.getByRole("button", { name: "Valider" }).click();
    await expect(button).not.toHaveClass(/set/);
  });
});

test.describe("affichage du Lien pendant la Session", () => {
  test("coche les Filtres rapides dans l'onglet du Tableau, sans recharger (LI-10, LI-11, PF-07)", async ({
    panel,
    context,
    jiraLoads,
  }) => {
    const jira = await openTabs(context);
    await seedTeam(panel, [
      { name: "Pierre-Yves", link: PIERRE_YVES },
      { name: "Camille", link: CAMILLE },
      { name: "Marion", link: BOARD },
    ]);
    await startDaily(panel);
    const before = (await tabs(panel)).length;

    await tile(panel, "Pierre-Yves").locator("button").click();
    await expect.poll(() => checkedFilters(jira)).toEqual(["5710"]);
    await expect.poll(() => activeUrl(panel)).toContain("rapidView=528");

    await tile(panel, "Camille").locator("button").click();
    await expect.poll(() => checkedFilters(jira)).toEqual(["5711"]);

    await tile(panel, "Marion").locator("button").click();
    await expect.poll(() => checkedFilters(jira)).toEqual([]);

    expect(jiraLoads["528"]).toBe(1);
    expect(await tabs(panel)).toHaveLength(before);
  });

  test("ouvre un onglet par Tableau et revient sur le premier (LI-10)", async ({ panel, context, jiraLoads }) => {
    const jira = await openTabs(context);
    await seedTeam(panel, [
      { name: "Yoann", link: OTHER_BOARD },
      { name: "Camille", link: CAMILLE },
    ]);
    await startDaily(panel);
    const before = (await tabs(panel)).length;

    await tile(panel, "Yoann").locator("button").click();
    await expect.poll(() => activeUrl(panel)).toBe(OTHER_BOARD);
    expect(await tabs(panel)).toHaveLength(before + 1);

    await tile(panel, "Camille").locator("button").click();
    await expect.poll(() => activeUrl(panel)).toContain("rapidView=528");
    await expect.poll(() => checkedFilters(jira)).toEqual(["5711"]);
    expect(jiraLoads).toEqual({ "528": 1, "999": 1 });
  });

  test("recharge avec le Lien quand la page n'a pas les Filtres rapides (LI-15)", async ({
    panel,
    context,
    jiraLoads,
  }) => {
    const page = await context.newPage();
    await page.goto(BOARD_WITHOUT_FILTERS);
    await seedTeam(panel, [{ name: "Camille", link: `${BOARD_WITHOUT_FILTERS}&quickFilter=5711` }]);
    await startDaily(panel);
    await tile(panel, "Camille").locator("button").click();
    await expect.poll(() => jiraLoads["404"]).toBe(2);
    await expect.poll(() => activeUrl(panel)).toBe(`${BOARD_WITHOUT_FILTERS}&quickFilter=5711`);
  });

  test("ne change aucun onglet sans Lien, ni au Tirage, à l'annulation ou à la fin (LI-12, LI-13)", async ({
    panel,
    context,
  }) => {
    await openTabs(context);
    await seedTeam(panel, [{ name: "Marion" }, { name: "Camille", link: CAMILLE }]);
    await startDaily(panel);
    const before = await tabs(panel);

    await tile(panel, "Marion").locator("button").click();
    await panel.getByTitle("Tirage au sort").click();
    await panel.getByTitle("Annuler").click();
    await panel.getByTitle("Annuler").click();
    await panel.getByTitle("Terminer").click();
    await expect(panel.getByRole("heading", { name: "Gestion de l'équipe" })).toBeVisible();
    expect(await tabs(panel)).toEqual(before);
  });
});
