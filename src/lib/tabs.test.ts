import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { activeTabUrl, chooseTab, openLink, requestBoardAccess, type TabInfo } from "./tabs";

const BOARD = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&projectKey=COP";
const PIERRE_YVES = `${BOARD}&quickFilter=5710#`;
const OTHER_BOARD = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=999";

function tab(id: number, url: string, active = false): TabInfo {
  return { id, index: id, active, url };
}

describe("chooseTab (LI-10)", () => {
  it("garde l'onglet actif s'il affiche le Tableau du Lien", () => {
    const tabs = [tab(0, BOARD), tab(1, `${BOARD}&quickFilter=42`, true)];
    expect(chooseTab(tabs, PIERRE_YVES)).toEqual({ tabId: 1 });
  });

  it("sinon prend le premier onglet de ce Tableau dans l'ordre de la fenêtre", () => {
    const tabs = [
      tab(0, "https://confluence.entreprise.com/", true),
      { ...tab(7, `${BOARD}&selectedIssue=COP-12`), index: 3 },
      { ...tab(5, BOARD), index: 2 },
    ];
    expect(chooseTab(tabs, PIERRE_YVES)).toEqual({ tabId: 5 });
  });

  it("demande un nouvel onglet pour un autre Tableau du même site", () => {
    expect(chooseTab([tab(0, BOARD, true)], OTHER_BOARD)).toBeNull();
  });

  it("demande un nouvel onglet sans onglet du Tableau", () => {
    expect(chooseTab([tab(0, "https://confluence.entreprise.com/", true)], PIERRE_YVES)).toBeNull();
    expect(chooseTab([{ id: 1, index: 1, active: false }, tab(2, "about:blank")], PIERRE_YVES)).toBeNull();
  });
});

describe("openLink (LI-10, LI-11, LI-15)", () => {
  let inject: ReturnType<typeof vi.fn>;

  // Le faux navigateur n'a pas de fenêtre courante après remise à zéro : on en ouvre une,
  // qui joue la fenêtre du panneau. Il ne simule pas l'injection de script : on la remplace.
  beforeEach(async () => {
    fakeBrowser.reset();
    await browser.windows.create({ focused: true });
    inject = vi.fn().mockResolvedValue([{ result: true }]);
    // Les surcharges à callback de l'API gênent le typage du faux : on le force.
    vi.spyOn(browser.scripting, "executeScript").mockImplementation(inject as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it("change les Filtres rapides dans l'onglet du Tableau, sans recharger", async () => {
    const jira = await browser.tabs.create({ url: `${BOARD}&quickFilter=42` });
    await browser.tabs.create({ url: "https://confluence.entreprise.com/", active: true });
    const before = (await browser.tabs.query({})).length;

    await openLink(PIERRE_YVES);

    expect(inject).toHaveBeenCalledWith(
      expect.objectContaining({ target: { tabId: jira.id }, args: [["5710"]] }),
    );
    const shown = await browser.tabs.get(jira.id!);
    expect(shown.url).toBe(`${BOARD}&quickFilter=42`);
    expect(shown.active).toBe(true);
    expect(await browser.tabs.query({})).toHaveLength(before);
  });

  it("recharge avec le Lien quand la page n'a pas les Filtres rapides (LI-15)", async () => {
    inject.mockResolvedValue([{ result: false }]);
    const jira = await browser.tabs.create({ url: BOARD, active: true });
    await openLink(PIERRE_YVES);
    expect((await browser.tabs.get(jira.id!)).url).toBe(PIERRE_YVES);
  });

  it("recharge avec le Lien quand l'accès au site est refusé (LI-15)", async () => {
    inject.mockRejectedValue(new Error("Cannot access contents of the page"));
    const jira = await browser.tabs.create({ url: BOARD, active: true });
    await openLink(PIERRE_YVES);
    expect((await browser.tabs.get(jira.id!)).url).toBe(PIERRE_YVES);
  });

  it("ouvre un nouvel onglet pour un autre Tableau, puis revient sur le premier", async () => {
    const first = await browser.tabs.create({ url: BOARD, active: true });
    const before = (await browser.tabs.query({})).length;

    await openLink(OTHER_BOARD);
    const [other] = await browser.tabs.query({ active: true });
    expect(other?.url).toBe(OTHER_BOARD);
    expect(await browser.tabs.query({})).toHaveLength(before + 1);
    expect(inject).not.toHaveBeenCalled();

    await openLink(PIERRE_YVES);
    expect((await browser.tabs.get(first.id!)).active).toBe(true);
    expect(await browser.tabs.query({})).toHaveLength(before + 1);
  });

  it("recharge une autre adresse sans essayer de script", async () => {
    const page = await browser.tabs.create({ url: "https://gitlab.entreprise.com/cop#a", active: true });
    await openLink("https://gitlab.entreprise.com/cop");
    expect((await browser.tabs.get(page.id!)).url).toBe("https://gitlab.entreprise.com/cop");
    expect(inject).not.toHaveBeenCalled();
  });
});

describe("requestBoardAccess (LI-16)", () => {
  const granted = (() => Promise.resolve(true)) as never;

  afterEach(() => vi.restoreAllMocks());

  it("demande une seule fois chaque site de Tableau Jira", () => {
    const request = vi.spyOn(browser.permissions, "request").mockImplementation(granted);
    requestBoardAccess([PIERRE_YVES, OTHER_BOARD, undefined, "https://gitlab.entreprise.com/cop"]);
    expect(request).toHaveBeenCalledWith({ origins: ["https://jira.entreprise.com/*"] });
  });

  it("ne demande rien sans Lien vers un Tableau Jira", () => {
    const request = vi.spyOn(browser.permissions, "request").mockImplementation(granted);
    requestBoardAccess([undefined, "https://gitlab.entreprise.com/cop"]);
    expect(request).not.toHaveBeenCalled();
  });
});

describe("activeTabUrl (LI-04)", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    await browser.windows.create({ focused: true });
  });

  it("lit l'adresse de l'onglet actif, seulement pour une page web", async () => {
    await browser.tabs.create({ url: PIERRE_YVES, active: true });
    expect(await activeTabUrl()).toBe(PIERRE_YVES);
    await browser.tabs.create({ url: "about:blank", active: true });
    expect(await activeTabUrl()).toBeNull();
  });
});
