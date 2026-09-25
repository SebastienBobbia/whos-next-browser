/**
 * Affichage d'un Lien dans un onglet de la fenêtre du panneau (LI-10 à LI-16),
 * et lecture de l'onglet actif (LI-04).
 *
 * L'adresse des onglets n'est lisible qu'avec l'autorisation `tabs`, et le
 * script des Filtres rapides ne s'injecte que sur un site autorisé (DI-11).
 */
import { browser } from "wxt/browser";
import { boardKey, jiraOrigin, jiraQuickFilters } from "./board";
import { setQuickFilters } from "./quick-filters";

/** Ce qu'il faut savoir d'un onglet pour choisir où afficher un Lien. */
export type TabInfo = { id?: number; index: number; active: boolean; url?: string };

/** Onglet à réutiliser, ou null pour en ouvrir un nouveau. */
export type TabChoice = { tabId: number } | null;

/**
 * Onglet qui affiche le Lien, un par Tableau (LI-10) :
 * 1. l'onglet actif, s'il affiche le Tableau du Lien ;
 * 2. sinon, le premier onglet de la fenêtre qui affiche ce Tableau ;
 * 3. sinon, aucun : il faut ouvrir un nouvel onglet.
 */
export function chooseTab(tabs: TabInfo[], link: string): TabChoice {
  const board = boardKey(link);
  if (!board) return null;
  const sameBoard = tabs
    .filter((tab) => tab.id !== undefined && boardKey(tab.url) === board)
    .sort((a, b) => a.index - b.index);
  const chosen = sameBoard.find((tab) => tab.active) ?? sameBoard[0];
  return chosen ? { tabId: chosen.id! } : null;
}

/**
 * Affiche le Lien. Dans l'onglet de son Tableau Jira, les Filtres rapides sont
 * changés dans la page, sans rechargement (LI-11). Sinon, ou si c'est
 * impossible, l'onglet charge le Lien tel quel (LI-15).
 */
export async function openLink(link: string): Promise<void> {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const choice = chooseTab(tabs, link);
  if (!choice) {
    await browser.tabs.create({ url: link, active: true });
    return;
  }
  await browser.tabs.update(choice.tabId, { active: true });
  if (await applyQuickFilters(choice.tabId, link)) return;
  await browser.tabs.update(choice.tabId, { url: link });
}

/** Change les Filtres rapides dans la page. false si ce n'est pas possible (LI-15). */
async function applyQuickFilters(tabId: number, link: string): Promise<boolean> {
  const filters = jiraQuickFilters(link);
  if (!filters) return false;
  try {
    // Sans accès au site, l'injection est refusée : on recharge.
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: setQuickFilters,
      args: [filters],
    });
    return injection?.result === true;
  } catch {
    return false;
  }
}

/**
 * Demande l'accès aux sites des Tableaux Jira de ces Liens (LI-16). Le
 * navigateur n'accepte la demande que pendant un geste de l'utilisateur : à
 * appeler au tout début du gestionnaire de clic, avant tout `await`. Un site
 * déjà autorisé ne déclenche aucune demande, et un refus n'empêche rien.
 */
export function requestBoardAccess(links: (string | undefined)[]): void {
  const origins = new Set<string>();
  for (const link of links) {
    const origin = link ? jiraOrigin(link) : null;
    if (origin) origins.add(`${origin}/*`);
  }
  if (origins.size === 0) return;
  browser.permissions.request({ origins: [...origins] }).catch(() => {});
}

/** Adresse de l'onglet actif de la fenêtre du panneau, si c'est une page web (LI-04). */
export async function activeTabUrl(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url;
  return url && /^https?:\/\//i.test(url) ? url : null;
}
