/**
 * Session en cours, conservée par le navigateur (SE-17) et partagée entre les
 * panneaux ouverts dans plusieurs fenêtres (SE-18).
 *
 * Chaque action met d'abord à jour l'état affiché, puis enregistre la Session :
 * le panneau n'attend jamais le stockage (PF-02, PF-16).
 */
import { Session } from "./session";
import { loadSession, onSessionChanged, saveSession } from "./storage";

/** Ce que la vue Session affiche. */
export type SessionState = {
  attendees: string[];
  remaining: string[];
  designated: string | null;
  complete: boolean;
  canDraw: boolean;
  canUndo: boolean;
};

export class SessionStore {
  /** null : aucune Session en cours. */
  state = $state<SessionState | null>(null);

  #session: Session | null = null;
  /** Dernier enregistrement écrit par ce panneau, pour ignorer son propre écho. */
  #written: string | null = null;
  #unsubscribe: (() => void) | null = null;

  /**
   * Reprend la Session conservée. Une Session complète est oubliée : sa
   * Célébration a été interrompue par la fermeture du panneau (SE-10).
   */
  async load(): Promise<void> {
    const restored = Session.fromSnapshot(await loadSession());
    if (restored?.isComplete) {
      this.#show(null);
      await this.#persist();
    } else {
      this.#show(restored);
    }
    this.#unsubscribe ??= onSessionChanged((value) => this.#receive(value));
  }

  /** Arrête de suivre les modifications faites ailleurs. */
  dispose(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  /** Lance une Session avec ses Participants, dans l'ordre de l'Équipe (SE-01). */
  async start(attendees: string[]): Promise<void> {
    this.#show(new Session(attendees));
    await this.#persist();
  }

  /** Marque un Participant comme ayant parlé (SE-03). false si rien n'a changé. */
  async markSpoken(name: string): Promise<boolean> {
    if (!this.#session?.markSpoken(name)) return false;
    this.#show(this.#session);
    await this.#persist();
    return true;
  }

  /** Tire au sort le prochain Désigné (SE-04). null si personne ne peut être tiré. */
  async draw(): Promise<string | null> {
    const chosen = this.#session?.draw() ?? null;
    if (chosen === null) return null;
    this.#show(this.#session);
    await this.#persist();
    return chosen;
  }

  /** Annule le Désigné, sinon la dernière prise de parole (SE-07). */
  async undo(): Promise<void> {
    if (!this.#session || this.#session.isComplete || !this.#session.undo()) return;
    this.#show(this.#session);
    await this.#persist();
  }

  /** Termine la Session et l'oublie (SE-09, SE-10). */
  async end(): Promise<void> {
    this.#show(null);
    await this.#persist();
  }

  /** Reprend la Session modifiée par un autre panneau ouvert (SE-18). */
  #receive(value: unknown): void {
    if (JSON.stringify(value ?? null) === this.#written) return;
    this.#show(Session.fromSnapshot(value));
  }

  #show(session: Session | null): void {
    this.#session = session;
    this.state = session
      ? {
          attendees: [...session.attendees],
          remaining: session.remaining,
          designated: session.designated,
          complete: session.isComplete,
          canDraw: session.canDraw,
          // Pendant la Célébration, l'annulation est désactivée (SE-08).
          canUndo: !session.isComplete && session.canUndo,
        }
      : null;
  }

  async #persist(): Promise<void> {
    const snapshot = this.#session?.toSnapshot() ?? null;
    this.#written = JSON.stringify(snapshot);
    await saveSession(snapshot);
  }
}

export const session = new SessionStore();
