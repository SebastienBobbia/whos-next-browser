/**
 * Coche exactement les Filtres rapides demandés et décoche tous les autres,
 * dans la page d'un Tableau Jira Data Center (LI-11, ADR 0004).
 *
 * Cette fonction est envoyée telle quelle dans l'onglet Jira par
 * `scripting.executeScript` : elle ne doit rien utiliser d'extérieur à son corps.
 *
 * Retourne false sans rien toucher si la page n'a pas de bouton de Filtre
 * rapide, ou pas celui d'un Filtre demandé : l'appelant recharge alors la page
 * avec le Lien (LI-15).
 */
export function setQuickFilters(wanted: string[]): boolean {
  // Un seul bouton par Filtre : cliquer deux fois le même annulerait l'effet.
  const byId = new Map<string, HTMLElement>();
  for (const button of document.querySelectorAll<HTMLElement>(
    "a.js-quickfilter-button[data-filter-id]",
  )) {
    const id = button.dataset.filterId;
    if (id && !byId.has(id)) byId.set(id, button);
  }
  if (byId.size === 0 || !wanted.every((id) => byId.has(id))) return false;

  const target = new Set(wanted);
  const isActive = (button: HTMLElement) =>
    button.getAttribute("aria-pressed") === "true" || button.classList.contains("ghx-active");
  const entries = [...byId.entries()];

  // Décocher d'abord, puis cocher : le même ordre qu'à la main.
  const toggles = [
    ...entries.filter(([id, button]) => isActive(button) && !target.has(id)),
    ...entries.filter(([id, button]) => !isActive(button) && target.has(id)),
  ];
  for (const [, button] of toggles) button.click();
  return true;
}
