/**
 * Icône d'un Membre : un emoji, ou une image rangée à part dans le stockage
 * sous `id`, avec le nom de son fichier d'origine pour l'affichage (IC-03, IC-11).
 */
export type Icon =
  | { type: "emoji"; value: string }
  | { type: "image"; id: string; file: string };

/** Un Membre de l'Équipe, tel qu'il est enregistré (voir docs/spec/06-persistance.md). */
export type Member = {
  name: string;
  /** Pas de champ : pas d'Icône */
  icon?: Icon;
  /** Adresse http(s) enregistrée telle quelle (LI-06). Pas de champ : pas de Lien */
  link?: string;
  /** Absent : présent uniquement quand il vaut true */
  absent?: boolean;
};

/** Compare deux noms de Membre : casse ignorée, accents distincts (EQ-10). */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");
}
