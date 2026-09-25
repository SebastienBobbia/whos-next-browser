/**
 * Valide une adresse saisie pour un Lien (LI-06).
 *
 * Retourne l'adresse débarrassée de ses espaces de début et de fin, sans autre
 * modification (fragment `#` compris), ou null si elle n'est pas une adresse
 * absolue en http:// ou https://. Le cas du champ vide est laissé à l'appelant.
 */
export function parseLink(raw: string): string | null {
  const link = raw.trim();
  if (!/^https?:\/\//i.test(link)) return null;
  try {
    return new URL(link).hostname ? link : null;
  } catch {
    return null;
  }
}
