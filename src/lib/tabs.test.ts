import { beforeEach, describe, expect, it } from "vitest";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { activeTabUrl, chooseTab, openLink, type TabInfo } from "./tabs";

const JIRA = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&quickFilter=5710#";

function tab(id: number, url: string, active = false): TabInfo {
  return { id, index: id, active, url };
}

describe("chooseTab (LI-10)", () => {
  it("garde l'onglet actif s'il est sur le même site", () => {
    const tabs = [tab(0, "https://jira.entreprise.com/browse/COP-1"), tab(1, "https://jira.entreprise.com/", true)];
    expect(chooseTab(tabs, JIRA)).toEqual({ tabId: 1 });
  });

  it("sinon prend le premier onglet du même site dans l'ordre de la fenêtre", () => {
    const tabs = [
      tab(0, "https://confluence.entreprise.com/", true),
      { ...tab(7, "https://jira.entreprise.com/b"), index: 3 },
      { ...tab(5, "https://jira.entreprise.com/a"), index: 2 },
    ];
    expect(chooseTab(tabs, JIRA)).toEqual({ tabId: 5 });
  });

  it("sinon demande un nouvel onglet", () => {
    expect(chooseTab([tab(0, "https://confluence.entreprise.com/", true)], JIRA)).toBeNull();
    expect(chooseTab([], JIRA)).toBeNull();
  });

  it("compare l'origine entière : protocole, hôte et port", () => {
    const tabs = [
      tab(0, "http://jira.entreprise.com/"),
      tab(1, "https://jira.entreprise.com:8443/"),
      tab(2, "https://autre.entreprise.com/"),
    ];
    expect(chooseTab(tabs, JIRA)).toBeNull();
  });

  it("ignore les onglets sans adresse web", () => {
    const tabs = [{ id: 0, index: 0, active: true }, tab(1, "about:blank"), tab(2, "chrome://extensions/")];
    expect(chooseTab(tabs, JIRA)).toBeNull();
  });
});

describe("openLink et activeTabUrl", () => {
  // Le faux navigateur n'a pas de fenêtre courante après remise à zéro : on en ouvre une,
  // qui joue la fenêtre du panneau.
  beforeEach(async () => {
    fakeBrowser.reset();
    await browser.windows.create({ focused: true });
  });

  it("charge le Lien dans l'onglet Jira existant et l'active (LI-10, LI-11)", async () => {
    const jira = await browser.tabs.create({ url: "https://jira.entreprise.com/secure/RapidBoard.jspa" });
    await browser.tabs.create({ url: "https://confluence.entreprise.com/", active: true });
    const before = (await browser.tabs.query({})).length;

    await openLink(JIRA);

    const updated = await browser.tabs.get(jira.id!);
    expect(updated.url).toBe(JIRA);
    expect(updated.active).toBe(true);
    expect(await browser.tabs.query({})).toHaveLength(before);
  });

  it("ouvre un nouvel onglet actif sans onglet du même site (LI-10)", async () => {
    await browser.tabs.create({ url: "https://confluence.entreprise.com/", active: true });
    const before = (await browser.tabs.query({})).length;
    await openLink(JIRA);
    const [active] = await browser.tabs.query({ active: true });
    expect(active?.url).toBe(JIRA);
    expect(await browser.tabs.query({})).toHaveLength(before + 1);
  });

  it("lit l'adresse de l'onglet actif, seulement pour une page web (LI-04)", async () => {
    await browser.tabs.create({ url: JIRA, active: true });
    expect(await activeTabUrl()).toBe(JIRA);
    await browser.tabs.create({ url: "about:blank", active: true });
    expect(await activeTabUrl()).toBeNull();
  });
});
