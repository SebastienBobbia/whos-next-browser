/**
 * Fichier d'Équipe : format, écriture et lecture (FI-02, FI-03, FI-07, FI-08).
 *
 * Aucune dépendance au navigateur : ce module est testé seul (voir
 * team-file.test.ts). Les images voyagent complètes, en data URL.
 */
import { parseLink } from "./link";

const FORMAT = "whos-next-equipe";
const VERSION = 1;

/** Icône telle qu'elle voyage dans le fichier. */
export type FileIcon =
  | { type: "emoji"; value: string }
  | { type: "image"; file: string; data: string };

/** Membre tel qu'il voyage dans le fichier : sans marque d'Absent (FI-02). */
export type FileMember = { name: string; icon?: FileIcon; link?: string };

export type TeamFile = { format: typeof FORMAT; version: typeof VERSION; members: FileMember[] };

export function teamFile(members: FileMember[]): TeamFile {
  return { format: FORMAT, version: VERSION, members };
}

/** JSON indenté de 2 espaces, accents et emojis écrits tels quels (FI-03). */
export function serializeTeamFile(file: TeamFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** Nom du fichier exporté : whos-next-equipe-AAAAMMJJ.json (FI-02). */
export function teamFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `whos-next-equipe-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.json`;
}

/**
 * Lit un Fichier d'Équipe. null si le fichier est illisible (FI-07). Un Membre,
 * une Icône ou un Lien inutilisable est ignoré (FI-08).
 */
export function parseTeamFile(text: string): FileMember[] | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { format, version, members } = value as Record<string, unknown>;
  if (format !== FORMAT || version !== VERSION || !Array.isArray(members)) return null;

  const seen = new Set<string>();
  const result: FileMember[] = [];
  for (const raw of members) {
    const member = parseMember(raw);
    // Un Membre est identifié par son nom : un nom exactement répété est ignoré.
    // Des noms qui ne diffèrent que par la casse sont gardés (EQ-10).
    if (!member || seen.has(member.name)) continue;
    seen.add(member.name);
    result.push(member);
  }
  return result;
}

function parseMember(raw: unknown): FileMember | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { name, icon, link } = raw as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim()) return null;
  const member: FileMember = { name: name.trim() };
  const parsedIcon = parseIcon(icon);
  if (parsedIcon) member.icon = parsedIcon;
  const parsedLink = typeof link === "string" ? parseLink(link) : null;
  if (parsedLink) member.link = parsedLink;
  return member;
}

function parseIcon(raw: unknown): FileIcon | null {
  if (typeof raw !== "object" || raw === null) return null;
  const icon = raw as Record<string, unknown>;
  if (icon.type === "emoji" && typeof icon.value === "string" && icon.value) {
    return { type: "emoji", value: icon.value };
  }
  if (icon.type === "image" && typeof icon.data === "string" && icon.data.startsWith("data:")) {
    return { type: "image", file: typeof icon.file === "string" ? icon.file : "image", data: icon.data };
  }
  return null;
}
