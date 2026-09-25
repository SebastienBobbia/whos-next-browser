/**
 * Domaine d'une Session : qui a parlé, qui reste, qui est Désigné.
 *
 * Aucune dépendance à Svelte ni au navigateur : cette classe est testée seule
 * (voir session.test.ts). Les identifiants SE-xx renvoient à docs/spec/04-session.md.
 */
export class Session {
  /** Participants, dans l'ordre de l'Équipe (SE-01). */
  readonly attendees: readonly string[];

  /** Participants qui ont parlé, dans leur ordre de passage. */
  #spoken: string[] = [];

  /** Désigné du dernier Tirage, ou null. */
  #designated: string | null = null;

  constructor(attendees: readonly string[]) {
    this.attendees = [...attendees];
  }

  /** Participants qui n'ont pas encore parlé, dans l'ordre de l'Équipe (SE-02). */
  get remaining(): string[] {
    const spoken = new Set(this.#spoken);
    return this.attendees.filter((name) => !spoken.has(name));
  }

  get spokenCount(): number {
    return this.#spoken.length;
  }

  get isComplete(): boolean {
    return this.#spoken.length === this.attendees.length;
  }

  get designated(): string | null {
    return this.#designated;
  }

  /**
   * Marque un Participant comme ayant parlé et efface le Désigné (SE-03).
   * Retourne false si le nom est inconnu ou a déjà parlé.
   */
  markSpoken(name: string): boolean {
    if (!this.attendees.includes(name) || this.#spoken.includes(name)) return false;
    this.#spoken.push(name);
    this.#designated = null;
    return true;
  }

  /** Restants qu'un Tirage peut choisir : tous sauf le Désigné actuel (SE-04). */
  get drawable(): string[] {
    return this.remaining.filter((name) => name !== this.#designated);
  }

  /** Le bouton Tirage est actif tant qu'un autre Restant peut être tiré (SE-05). */
  get canDraw(): boolean {
    return this.drawable.length > 0;
  }

  /**
   * Tire au sort un Restant autre que le Désigné actuel, qui devient le
   * nouveau Désigné (SE-04). Retourne null s'il n'y a personne à tirer.
   */
  draw(random: () => number = Math.random): string | null {
    const pool = this.drawable;
    if (pool.length === 0) return null;
    const chosen = pool[Math.floor(random() * pool.length)]!;
    this.#designated = chosen;
    return chosen;
  }

  /** L'annulation est active dès qu'il y a un Désigné ou un Participant qui a parlé (SE-08). */
  get canUndo(): boolean {
    return this.#designated !== null || this.#spoken.length > 0;
  }

  /**
   * Annule : efface d'abord le Désigné, sinon rend Restant le dernier
   * Participant à avoir parlé (SE-07). Retourne ce qui a été annulé.
   */
  undo(): { cleared: "designated" | "spoken"; name: string } | null {
    if (this.#designated !== null) {
      const name = this.#designated;
      this.#designated = null;
      return { cleared: "designated", name };
    }
    const name = this.#spoken.pop();
    if (name === undefined) return null;
    return { cleared: "spoken", name };
  }

  /** État complet, pour conserver la Session hors du panneau (SE-17). */
  toSnapshot(): SessionSnapshot {
    return {
      attendees: [...this.attendees],
      spoken: [...this.#spoken],
      designated: this.#designated,
    };
  }

  /** Reconstruit une Session conservée, ou null si l'état est incohérent. */
  static fromSnapshot(value: unknown): Session | null {
    if (!isSnapshot(value)) return null;
    const { attendees, spoken, designated } = value;
    if (new Set(attendees).size !== attendees.length) return null;

    const session = new Session(attendees);
    for (const name of spoken) {
      if (!session.markSpoken(name)) return null;
    }
    if (designated !== null) {
      if (!session.remaining.includes(designated)) return null;
      session.#designated = designated;
    }
    return session;
  }
}

/** État d'une Session tel qu'il est conservé par le navigateur. */
export type SessionSnapshot = {
  attendees: string[];
  /** dans l'ordre de passage */
  spoken: string[];
  designated: string | null;
};

function isSnapshot(value: unknown): value is SessionSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const { attendees, spoken, designated } = value as Record<string, unknown>;
  return (
    isStringArray(attendees) &&
    isStringArray(spoken) &&
    (designated === null || typeof designated === "string")
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
