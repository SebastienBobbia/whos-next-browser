/**
 * Annonce une version signée à Firefox et Zen : ajoute son lien et son
 * empreinte dans updates.json, que le manifeste désigne par `update_url` (DI-15).
 *
 *   node scripts/announce-update.mjs 1.0.0 .output/whos-next-browser-1.0.0-firefox.xpi
 *
 * Lancé par GitHub Actions après la publication de la release (DI-09).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Doit rester égal à GECKO_ID dans wxt.config.ts. */
export const GECKO_ID = "whos-next@sebastienbobbia.github.io";
const RELEASES = "https://github.com/SebastienBobbia/whos-next-browser/releases/download";

/** Ajoute une version à un contenu de updates.json, sans le modifier sur place. */
export function announce(updates, version, fileName, sha256) {
  const next = structuredClone(updates);
  const list = next.addons[GECKO_ID].updates;
  if (list.some((entry) => entry.version === version)) {
    throw new Error(`La version ${version} est déjà annoncée.`);
  }
  list.push({
    version,
    update_link: `${RELEASES}/v${version}/${fileName}`,
    update_hash: `sha256:${sha256}`,
  });
  return next;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [version, xpi] = process.argv.slice(2);
  if (!version || !xpi) {
    console.error("Usage : node scripts/announce-update.mjs <version> <fichier .xpi signé>");
    process.exit(1);
  }
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(xpi)).digest("hex");
  const updates = JSON.parse(fs.readFileSync("updates.json", "utf8"));
  const next = announce(updates, version, path.basename(xpi), sha256);
  fs.writeFileSync("updates.json", `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Version ${version} annoncée dans updates.json`);
}
