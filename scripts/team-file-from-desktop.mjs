/**
 * Crée un Fichier d'Équipe à partir des données de l'application de bureau :
 * un dossier qui contient team.json (format v2) et le dossier icons.
 *
 * Les Membres gardent leur nom, leur ordre et leur Icône. Ils n'ont pas de
 * Lien, et les marques d'Absent ne sont pas reprises (FI-02).
 *
 *   npm run team-file -- "%APPDATA%\WhosNext"
 *
 * Le fichier créé contient des noms et des images : il ne va jamais dans le
 * dépôt, qui est public (FI-10).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Convertit un dossier de données de l'application de bureau en Fichier d'Équipe. */
export function convertDesktopData(dir) {
  const team = JSON.parse(fs.readFileSync(path.join(dir, "team.json"), "utf8"));
  if (team?.version !== 2 || !Array.isArray(team.members)) {
    throw new Error("team.json n'est pas au format v2 de l'application de bureau.");
  }

  const members = [];
  for (const raw of team.members) {
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name) continue;
    const member = { name };
    if (raw.icon_type === "emoji" && raw.icon_value) {
      member.icon = { type: "emoji", value: raw.icon_value };
    } else if (raw.icon_type === "image" && raw.icon_value) {
      const file = path.join(dir, "icons", raw.icon_value);
      const mime = MIME[path.extname(file).toLowerCase()];
      if (mime && fs.existsSync(file)) {
        const data = fs.readFileSync(file).toString("base64");
        member.icon = { type: "image", file: raw.icon_value, data: `data:${mime};base64,${data}` };
      }
    }
    members.push(member);
  }
  return { format: "whos-next-equipe", version: 1, members };
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [dir, target] = process.argv.slice(2);
  if (!dir) {
    console.error("Usage : npm run team-file -- <dossier de données de l'application de bureau> [fichier]");
    process.exit(1);
  }
  const file = convertDesktopData(dir);
  const out = path.resolve(target ?? `whos-next-equipe-${today()}.json`);
  fs.writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  console.log(`${file.members.length} membres écrits dans ${out}`);
}
