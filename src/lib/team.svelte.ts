/**
 * État de l'Équipe : chargement, modifications, sauvegarde, import et export.
 *
 * Chaque modification est enregistrée tout de suite (PE-08). Les identifiants
 * EQ-xx, IC-xx, LI-xx, PR-xx et FI-xx renvoient à docs/spec/.
 */
import { forgetIcon } from "./icons";
import { prepareImage } from "./images";
import {
  loadImage,
  loadTeam,
  onTeamChanged,
  parseTeam,
  removeImages,
  saveImage,
  saveTeam,
  teamRecord,
} from "./storage";
import { serializeTeamFile, teamFile, type FileMember } from "./team-file";
import { sameName, type Member } from "./types";

export class TeamStore {
  members = $state<Member[]>([]);

  /** Dernier enregistrement écrit par ce panneau, pour ignorer son propre écho. */
  #written: string | null = null;
  #unsubscribe: (() => void) | null = null;

  /**
   * Charge l'Équipe. Des données illisibles donnent une Équipe vide, et ne sont
   * écrasées qu'à la première modification (PE-07).
   */
  async load(): Promise<void> {
    this.members = (await loadTeam()) ?? [];
    this.#unsubscribe ??= onTeamChanged((value) => this.#receive(value));
  }

  /** Arrête de suivre les modifications faites ailleurs. */
  dispose(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  /** Reprend une Équipe modifiée par un autre panneau ouvert. */
  #receive(value: unknown): void {
    if (JSON.stringify(value) === this.#written) return;
    const members = parseTeam(value);
    if (members) this.members = members;
  }

  async #persist(): Promise<void> {
    const record = teamRecord($state.snapshot(this.members));
    this.#written = JSON.stringify(record);
    await saveTeam(record);
  }

  #find(name: string): Member | undefined {
    return this.members.find((m) => m.name === name);
  }

  /** Ajoute un Membre à la fin de l'Équipe, sans Icône ni Lien (EQ-08 à EQ-10). */
  async add(rawName: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const name = rawName.trim();
    if (!name) return { ok: false, error: "Veuillez entrer un nom." };
    if (this.members.some((m) => sameName(m.name, name))) {
      return { ok: false, error: `"${name}" existe déjà dans l'équipe.` };
    }
    this.members.push({ name });
    await this.#persist();
    return { ok: true };
  }

  /** Supprime un Membre, avec son Icône et son Lien (EQ-12). */
  async remove(name: string): Promise<void> {
    const member = this.#find(name);
    if (!member) return;
    const image = member.icon?.type === "image" ? member.icon.id : null;
    this.members = this.members.filter((m) => m.name !== name);
    await this.#persist();
    if (image) await this.#dropImage(image);
  }

  /** Déplace un Membre : `to` est la position d'insertion avant déplacement (EQ-13, EQ-14). */
  async reorder(from: number, to: number): Promise<void> {
    if (from === to || from === to - 1) return;
    const next = [...this.members];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to > from ? to - 1 : to, 0, moved);
    this.members = next;
    await this.#persist();
  }

  /** Donne un emoji comme Icône (IC-06). Une ancienne image est supprimée (IC-12). */
  async setEmoji(name: string, emoji: string): Promise<void> {
    const member = this.#find(name);
    if (!member) return;
    const previous = member.icon?.type === "image" ? member.icon.id : null;
    member.icon = { type: "emoji", value: emoji };
    await this.#persist();
    if (previous) await this.#dropImage(previous);
  }

  /**
   * Donne une image comme Icône. La nouvelle image est enregistrée avant que
   * l'ancienne soit supprimée (IC-07, IC-11, IC-12).
   */
  async setImage(name: string, file: File): Promise<void> {
    const member = this.#find(name);
    if (!member) return;
    const previous = member.icon?.type === "image" ? member.icon.id : null;

    const id = crypto.randomUUID();
    await saveImage(id, await prepareImage(file));
    member.icon = { type: "image", id, file: file.name };
    await this.#persist();

    if (previous) await this.#dropImage(previous);
  }

  /** Retire l'Icône d'un Membre (IC-09). */
  async clearIcon(name: string): Promise<void> {
    const member = this.#find(name);
    if (!member?.icon) return;
    const previous = member.icon.type === "image" ? member.icon.id : null;
    delete member.icon;
    await this.#persist();
    if (previous) await this.#dropImage(previous);
  }

  /** Définit le Lien d'un Membre, déjà validé (LI-06), ou le retire avec null (LI-07). */
  async setLink(name: string, link: string | null): Promise<void> {
    const member = this.#find(name);
    if (!member) return;
    if (link) member.link = link;
    else delete member.link;
    await this.#persist();
  }

  /** Enregistre les Absents au lancement d'une Session (PR-09). */
  async saveAbsents(presentNames: string[]): Promise<void> {
    const present = new Set(presentNames);
    for (const member of this.members) {
      if (present.has(member.name)) delete member.absent;
      else member.absent = true;
    }
    await this.#persist();
  }

  /** Fichier d'Équipe de l'Équipe actuelle : Membres, Icônes et Liens, sans les Absents (FI-02). */
  async exportFile(): Promise<string> {
    const members: FileMember[] = [];
    for (const member of $state.snapshot(this.members)) {
      const out: FileMember = { name: member.name };
      if (member.icon?.type === "emoji") {
        out.icon = { type: "emoji", value: member.icon.value };
      } else if (member.icon?.type === "image") {
        const data = await loadImage(member.icon.id);
        if (data) out.icon = { type: "image", file: member.icon.file, data };
      }
      if (member.link) out.link = member.link;
      members.push(out);
    }
    return serializeTeamFile(teamFile(members));
  }

  /**
   * Remplace toute l'Équipe par celle d'un Fichier d'Équipe (FI-05). Un Membre
   * reste Absent si un Absent de l'ancienne Équipe portait le même nom (FI-06).
   * Les nouvelles images sont enregistrées avant la suppression des anciennes.
   */
  async replaceWith(incoming: FileMember[]): Promise<void> {
    const absents = this.members.filter((m) => m.absent).map((m) => m.name);
    const previousImages = this.members.flatMap((m) => (m.icon?.type === "image" ? [m.icon.id] : []));

    const members: Member[] = [];
    for (const source of incoming) {
      const member: Member = { name: source.name };
      if (source.icon?.type === "emoji") {
        member.icon = { type: "emoji", value: source.icon.value };
      } else if (source.icon?.type === "image") {
        const id = crypto.randomUUID();
        await saveImage(id, source.icon.data);
        member.icon = { type: "image", id, file: source.icon.file };
      }
      if (source.link) member.link = source.link;
      if (absents.some((name) => sameName(name, source.name))) member.absent = true;
      members.push(member);
    }

    this.members = members;
    await this.#persist();
    previousImages.forEach(forgetIcon);
    await removeImages(previousImages);
  }

  async #dropImage(id: string): Promise<void> {
    forgetIcon(id);
    await removeImages([id]);
  }
}

export const team = new TeamStore();
