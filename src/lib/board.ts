/**
 * Ce qu'une adresse dit du Tableau qu'elle affiche et de ses Filtres rapides
 * (LI-10, LI-11, LI-16). Aucune dépendance au navigateur : testé seul.
 */

/** Chemin d'un Tableau Jira Data Center, qui porte son numéro dans `rapidView`. */
const JIRA_BOARD_PATH = /\/RapidBoard\.jspa$/i;

/**
 * Identité du Tableau affiché par une adresse : deux adresses de même identité
 * se partagent un onglet (LI-10). null si ce n'est pas une page web.
 *
 * Pour un Tableau Jira, seuls comptent l'origine, le chemin et `rapidView` :
 * les Filtres rapides et le ticket ouvert (`selectedIssue`) ne changent pas le
 * Tableau. Pour une autre adresse, tout compte sauf le fragment.
 */
export function boardKey(url: string | undefined): string | null {
  const parsed = parseWebUrl(url);
  if (!parsed) return null;
  const rapidView = jiraRapidView(parsed);
  if (rapidView !== null) return `${parsed.origin}${parsed.pathname}?rapidView=${rapidView}`;
  return `${parsed.origin}${parsed.pathname}${parsed.search}`;
}

/**
 * Filtres rapides d'un Lien vers un Tableau Jira, dans l'ordre de l'adresse
 * (paramètres `quickFilter`). Tableau vide : aucun Filtre rapide. null si le
 * Lien n'est pas un Tableau Jira.
 */
export function jiraQuickFilters(link: string): string[] | null {
  const parsed = parseWebUrl(link);
  if (!parsed || jiraRapidView(parsed) === null) return null;
  return parsed.searchParams.getAll("quickFilter").filter((id) => id !== "");
}

/** Origine du site d'un Tableau Jira, pour en demander l'accès (LI-16). null sinon. */
export function jiraOrigin(link: string): string | null {
  const parsed = parseWebUrl(link);
  return parsed && jiraRapidView(parsed) !== null ? parsed.origin : null;
}

function jiraRapidView(url: URL): string | null {
  if (!JIRA_BOARD_PATH.test(url.pathname)) return null;
  return url.searchParams.get("rapidView") || null;
}

function parseWebUrl(url: string | undefined): URL | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
