import fs from "node:fs";
import path from "node:path";
import { test as base, chromium, expect, type BrowserContext, type Page } from "@playwright/test";
import type { Member } from "../src/lib/types";

export { expect };

/** Identifiant fixé par la clé publique du manifeste Chrome (DI-10). */
export const EXTENSION_ID = "fimkkabgaecgpjhklgefimmefecaoibl";
export const PANEL_URL = `chrome-extension://${EXTENSION_ID}/sidepanel.html`;

export const JIRA = "https://jira.entreprise.com";
export const BOARD = `${JIRA}/secure/RapidBoard.jspa?rapidView=528&projectKey=COP`;
/** Tableau dont la page n'a aucun bouton de Filtre rapide (LI-15). */
export const BOARD_WITHOUT_FILTERS = `${JIRA}/secure/RapidBoard.jspa?rapidView=404`;
export const CONFLUENCE = "https://confluence.entreprise.com/display/COP";

/** Largeur du panneau pendant les tests : une largeur courante du panneau de Chrome. */
export const PANEL_SIZE = { width: 340, height: 700 };

/**
 * Fausse page de Tableau Jira Data Center 10.3 : mêmes boutons de Filtre
 * rapide que la vraie (copiés depuis la page), qui se cochent au clic et
 * mettent à jour l'adresse, comme Jira.
 */
function jiraPage(withFilters: boolean): string {
  const button = (id: string, label: string) =>
    `<a role="button" href="#" aria-pressed="false" class="js-quickfilter-button aui-button aui-button-link" data-filter-id="${id}">${label}</a>`;
  const buttons = withFilters
    ? button("5710", "Pierre-Yves") + button("5711", "Camille") + button("1", "Only My Issues")
    : "";
  return `<!doctype html><title>Tableau</title><body>${buttons}<script>
    const buttons = [...document.querySelectorAll(".js-quickfilter-button")];
    const initial = new URL(location.href).searchParams.getAll("quickFilter");
    const render = (b, on) => { b.setAttribute("aria-pressed", String(on)); b.classList.toggle("ghx-active", on); };
    for (const b of buttons) {
      render(b, initial.includes(b.dataset.filterId));
      b.addEventListener("click", (e) => {
        e.preventDefault();
        render(b, b.getAttribute("aria-pressed") !== "true");
        const u = new URL(location.href);
        u.searchParams.delete("quickFilter");
        for (const x of buttons) if (x.getAttribute("aria-pressed") === "true") u.searchParams.append("quickFilter", x.dataset.filterId);
        history.replaceState(null, "", u);
      });
    }
  </script>`;
}

type WorkerFixtures = { extensionPath: string };

type TestFixtures = {
  /** Chargements complets de page par Tableau Jira (`rapidView`). */
  jiraLoads: Record<string, number>;
  /** Erreurs JavaScript du panneau : un test échoue s'il en reste. */
  errors: string[];
  /** Le panneau de l'extension, ouvert comme une page, sur une Équipe vide. */
  panel: Page;
};

export const test = base.extend<TestFixtures & { context: BrowserContext }, WorkerFixtures>({
  // Copie de l'extension construite, avec l'accès au faux Jira déjà accordé : Playwright
  // ne sait pas répondre à la demande d'accès du navigateur (LI-16, en recette manuelle).
  extensionPath: [
    async ({}, use, workerInfo) => {
      const source = path.resolve(".output/chrome-mv3");
      if (!fs.existsSync(source)) throw new Error("Extension absente : lancer `npm run build`.");
      const target = path.resolve(`.output/e2e-chrome-${workerInfo.workerIndex}`);
      fs.rmSync(target, { recursive: true, force: true });
      fs.cpSync(source, target, { recursive: true });
      const manifestPath = path.join(target, "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      manifest.host_permissions = [`${JIRA}/*`];
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      await use(target);
    },
    { scope: "worker" },
  ],

  jiraLoads: async ({}, use) => {
    await use({});
  },

  context: async ({ extensionPath, jiraLoads }, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      acceptDownloads: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await context.route(/https:\/\/(jira|confluence)\.entreprise\.com\/.*/, (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.endsWith("RapidBoard.jspa")) {
        return route.fulfill({ contentType: "text/html", body: "<title>Confluence</title>" });
      }
      const view = url.searchParams.get("rapidView") ?? "";
      jiraLoads[view] = (jiraLoads[view] ?? 0) + 1;
      return route.fulfill({ contentType: "text/html", body: jiraPage(view !== "404") });
    });
    await use(context);
    await context.close();
  },

  errors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
    expect(errors, "erreurs JavaScript dans le panneau").toEqual([]);
  },

  panel: async ({ context, errors }, use) => {
    const panel = await openPanel(context, errors);
    await use(panel);
  },
});

/** Ouvre un panneau de plus, comme dans une seconde fenêtre du navigateur. */
export async function openPanel(context: BrowserContext, errors: string[]): Promise<Page> {
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize(PANEL_SIZE);
  await page.goto(PANEL_URL);
  // Vue Équipe, ou vue Session si une Session est en cours (EQ-01).
  await page.locator(".view, .session").first().waitFor();
  return page;
}

/**
 * Enregistre une Équipe directement dans le stockage de l'extension, puis
 * recharge le panneau. Chaque image est une data URL, rangée sous son id.
 */
export async function seedTeam(
  panel: Page,
  members: Member[],
  images: Record<string, string> = {},
): Promise<void> {
  await panel.evaluate(
    async ({ members, images }) => {
      const entries = Object.fromEntries(Object.entries(images).map(([id, url]) => [`image:${id}`, url]));
      await chrome.storage.local.set({ team: { version: 1, members }, ...entries });
    },
    { members, images },
  );
  await panel.reload();
  await panel.getByRole("heading").first().waitFor();
}

/** Image carrée d'une seule couleur, dessinée par le navigateur, en data URL PNG. */
export async function solidPng(panel: Page, color: string, size = 32): Promise<string> {
  return panel.evaluate(
    ({ color, size }) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      return canvas.toDataURL("image/png");
    },
    { color, size },
  );
}

/** Convertit une data URL en fichier à donner au sélecteur de fichiers. */
export function dataUrlFile(name: string, dataUrl: string) {
  const [head, body] = dataUrl.split(",", 2);
  const mimeType = /data:([^;,]+)/.exec(head!)![1]!;
  const buffer = head!.endsWith(";base64") ? Buffer.from(body!, "base64") : Buffer.from(decodeURIComponent(body!));
  return { name, mimeType, buffer };
}

/** Ligne d'un Membre dans la vue Équipe. */
export function row(panel: Page, name: string) {
  return panel.locator(".row", { hasText: name });
}

/** Tuile d'un Restant dans la vue Session. */
export function tile(panel: Page, name: string) {
  return panel.locator(".tile", { hasText: name });
}

/** Coche les présents et lance la Session depuis la vue Équipe. */
export async function startDaily(panel: Page, absent: string[] = []): Promise<void> {
  await panel.getByRole("button", { name: /Préparer le Daily/ }).click();
  for (const name of absent) {
    const box = panel.locator("label", { hasText: name }).locator("input");
    if (await box.isChecked()) await box.uncheck();
  }
  await panel.getByRole("button", { name: /Démarrer le Daily/ }).click();
  await panel.locator(".session").waitFor();
}

/** Donne un Lien à un Membre par la fenêtre Lien. */
export async function setLink(panel: Page, name: string, link: string): Promise<void> {
  await row(panel, name).locator(".link-btn").click();
  await panel.locator(".dialog input").fill(link);
  await panel.getByRole("button", { name: "Valider" }).click();
  await expect(panel.locator(".dialog")).toHaveCount(0);
}

/** Onglets du navigateur, vus par l'extension. */
export async function tabs(panel: Page): Promise<{ url: string; active: boolean }[]> {
  return panel.evaluate(async () =>
    (await chrome.tabs.query({})).map((t) => ({ url: t.url ?? "", active: t.active })),
  );
}

/** Filtres rapides cochés dans une page de Tableau. */
export async function checkedFilters(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map((b) => b.dataset.filterId!),
  );
}
