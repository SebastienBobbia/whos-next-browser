/**
 * Chargement d'un Lien dans un onglet de la fenêtre du panneau (LI-10 à LI-14),
 * et lecture de l'onglet actif (LI-04).
 *
 * L'adresse des onglets n'est lisible qu'avec l'autorisation `tabs` (DI-11).
 */
import { browser } from "wxt/browser";

/** Ce qu'il faut savoir d'un onglet pour choisir où charger un Lien. */
export type TabInfo = { id?: number; index: number; active: boolean; url?: string };

/** Onglet à réutiliser, ou null pour en ouvrir un nouveau. */
export type TabChoice = { tabId: number } | null;

/**
 * Onglet qui reçoit le Lien, dans cet ordre (LI-10) :
 * 1. l'onglet actif, s'il affiche une page du même site ;
 * 2. sinon, le premier onglet de la fenêtre qui affiche une page du même site ;
 * 3. sinon, aucun : il faut ouvrir un nouvel onglet.
 *
 * « Même site » veut dire même origine : protocole, hôte et port.
 */
export function chooseTab(tabs: TabInfo[], link: string): TabChoice {
  const origin = originOf(link);
  if (!origin) return null;
  const sameSite = tabs
    .filter((tab) => tab.id !== undefined && originOf(tab.url) === origin)
    .sort((a, b) => a.index - b.index);
  const chosen = sameSite.find((tab) => tab.active) ?? sameSite[0];
  return chosen ? { tabId: chosen.id! } : null;
}

function originOf(url: string | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Charge le Lien tel quel (LI-11) dans l'onglet choisi, qui devient l'onglet
 * actif, ou dans un nouvel onglet actif de la fenêtre du panneau.
 */
export async function openLink(link: string): Promise<void> {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const choice = chooseTab(tabs, link);
  if (choice) {
    await browser.tabs.update(choice.tabId, { url: link, active: true });
  } else {
    await browser.tabs.create({ url: link, active: true });
  }
}

/** Adresse de l'onglet actif de la fenêtre du panneau, si c'est une page web (LI-04). */
export async function activeTabUrl(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url;
  return url && /^https?:\/\//i.test(url) ? url : null;
}
