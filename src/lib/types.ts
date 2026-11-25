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
  /** Désactivé (absence longue) : présent uniquement quand il vaut true (EQ-20) */
  disabled?: boolean;
};

/** Compare deux noms de Membre : casse ignorée, accents distincts (EQ-10). */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");
}

/** Normalise un nom pour la correspondance Équipe <-> Planning (PR-13) : sans casse, sans accents, sans points. */
export function normalizePlanningName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export type PlanningMemberStatus = {
  unavailable: boolean;
  status?: string;
};

export type PlanningResult =
  | { state: "unconfigured" }
  | { state: "missing_permission"; planningUrl: string }
  | { state: "auth_required"; planningUrl: string; username?: string }
  | { state: "auth_failed"; planningUrl: string; username: string }
  | { state: "error"; planningUrl: string; message: string }
  | {
      state: "ready";
      planningUrl: string;
      resources: Record<string, PlanningMemberStatus>;
    };

