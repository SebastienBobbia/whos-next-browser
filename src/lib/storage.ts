/**
 * Accès au stockage de l'extension (voir docs/spec/06-persistance.md).
 *
 * - `storage.local`, durable : l'Équipe sous `team`, et chaque image sous
 *   `image:<id>`, à part pour qu'un réordonnancement ne réécrive pas les images.
 * - `storage.session`, effacé à la fermeture du navigateur : la Session en cours
 *   sous `session` (SE-17).
 */
import { browser } from "wxt/browser";
import type { SessionSnapshot } from "./session";
import type { Icon, Member } from "./types";

const TEAM_KEY = "team";
const IMAGE_PREFIX = "image:";
const SESSION_KEY = "session";

/** Version du format interne de l'Équipe (PE-02). */
const TEAM_VERSION = 1;

export type TeamRecord = { version: typeof TEAM_VERSION; members: Member[] };

export function teamRecord(members: Member[]): TeamRecord {
  return { version: TEAM_VERSION, members };
}

/**
 * Lit l'Équipe enregistrée : [] au premier lancement (PE-13), null si les
 * données sont illisibles (PE-07).
 */
export async function loadTeam(): Promise<Member[] | null> {
  const stored = await browser.storage.local.get(TEAM_KEY);
  if (!(TEAM_KEY in stored)) return [];
  return parseTeam(stored[TEAM_KEY]);
}

export async function saveTeam(record: TeamRecord): Promise<void> {
  await browser.storage.local.set({ [TEAM_KEY]: record });
}

/** Relit un enregistrement de l'Équipe, ou null s'il est illisible. Un Membre invalide est ignoré. */
export function parseTeam(value: unknown): Member[] | null {
  if (typeof value !== "object" || value === null) return null;
  const { version, members } = value as Record<string, unknown>;
  if (version !== TEAM_VERSION || !Array.isArray(members)) return null;
  return members.flatMap((raw) => {
    const member = parseMember(raw);
    return member ? [member] : [];
  });
}

function parseMember(raw: unknown): Member | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { name, icon, link, absent } = raw as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim()) return null;
  const member: Member = { name };
  const parsedIcon = parseIcon(icon);
  if (parsedIcon) member.icon = parsedIcon;
  if (typeof link === "string" && link) member.link = link;
  if (absent === true) member.absent = true;
  return member;
}

function parseIcon(raw: unknown): Icon | null {
  if (typeof raw !== "object" || raw === null) return null;
  const icon = raw as Record<string, unknown>;
  if (icon.type === "emoji" && typeof icon.value === "string" && icon.value) {
    return { type: "emoji", value: icon.value };
  }
  if (icon.type === "image" && typeof icon.id === "string" && typeof icon.file === "string") {
    return { type: "image", id: icon.id, file: icon.file };
  }
  return null;
}

/** Suit les modifications de l'Équipe faites ailleurs (autre fenêtre, import). */
export function onTeamChanged(listener: (value: unknown) => void): () => void {
  return onKeyChanged("local", TEAM_KEY, listener);
}

/** Lit une image enregistrée, sous forme de data URL, ou null si elle n'existe pas. */
export async function loadImage(id: string): Promise<string | null> {
  const key = IMAGE_PREFIX + id;
  const stored = await browser.storage.local.get(key);
  const value = stored[key];
  return typeof value === "string" ? value : null;
}

export async function saveImage(id: string, dataUrl: string): Promise<void> {
  await browser.storage.local.set({ [IMAGE_PREFIX + id]: dataUrl });
}

export async function removeImages(ids: string[]): Promise<void> {
  if (ids.length > 0) await browser.storage.local.remove(ids.map((id) => IMAGE_PREFIX + id));
}

/** Lit la Session conservée, telle qu'elle a été enregistrée (à valider par l'appelant). */
export async function loadSession(): Promise<unknown> {
  const stored = await browser.storage.session.get(SESSION_KEY);
  return stored[SESSION_KEY];
}

/** Conserve la Session en cours, ou l'oublie avec null (SE-09, SE-10). */
export async function saveSession(snapshot: SessionSnapshot | null): Promise<void> {
  if (snapshot) await browser.storage.session.set({ [SESSION_KEY]: snapshot });
  else await browser.storage.session.remove(SESSION_KEY);
}

/** Suit la Session modifiée dans une autre fenêtre (SE-18). undefined : Session oubliée. */
export function onSessionChanged(listener: (value: unknown) => void): () => void {
  return onKeyChanged("session", SESSION_KEY, listener);
}

function onKeyChanged(
  area: "local" | "session",
  key: string,
  listener: (value: unknown) => void,
): () => void {
  const handler = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
    if (areaName === area && key in changes) listener(changes[key]!.newValue);
  };
  browser.storage.onChanged.addListener(handler);
  return () => browser.storage.onChanged.removeListener(handler);
}
