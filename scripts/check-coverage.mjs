/**
 * Vérifie que chaque exigence de la spec est couverte par au moins un test
 * automatique ou une ligne de la recette manuelle (docs/spec/README.md).
 *
 * Une exigence est définie dans docs/spec/ par son identifiant en gras
 * (**EQ-05**). Elle est couverte si cet identifiant apparaît dans un test
 * unitaire, un test de bout en bout ou docs/recette-manuelle.md.
 *
 *   npm run check:coverage
 */
import fs from "node:fs";
import path from "node:path";

const ID = /\b[A-Z]{2}-\d{2}\b/g;

function files(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

const defined = new Set();
for (const file of files("docs/spec", /\.md$/)) {
  for (const [, id] of fs.readFileSync(file, "utf8").matchAll(/\*\*([A-Z]{2}-\d{2})\*\*/g)) defined.add(id);
}

const sources = [
  ...files("src", /\.test\.ts$/),
  ...files("scripts", /\.test\.mjs$/),
  ...files("e2e", /\.spec\.ts$/),
  "docs/recette-manuelle.md",
];
const covered = new Set(sources.flatMap((file) => fs.readFileSync(file, "utf8").match(ID) ?? []));

const missing = [...defined].filter((id) => !covered.has(id)).sort();
if (missing.length > 0) {
  console.error(`Exigences sans test ni ligne de recette (${missing.length}) : ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`${defined.size} exigences, toutes couvertes.`);
