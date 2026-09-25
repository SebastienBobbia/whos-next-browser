import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { announce, GECKO_ID } from "./announce-update.mjs";

const empty = () => JSON.parse(fs.readFileSync("updates.json", "utf8"));

describe("announce (DI-15)", () => {
  it("vise l'identifiant Firefox du manifeste", () => {
    expect(fs.readFileSync("wxt.config.ts", "utf8")).toContain(`"${GECKO_ID}"`);
    expect(Object.keys(empty().addons)).toEqual([GECKO_ID]);
  });

  it("ajoute la version avec le lien de la release et l'empreinte du .xpi", () => {
    const next = announce(empty(), "1.0.0", "whos-next-browser-1.0.0-firefox.xpi", "abc123");
    expect(next.addons[GECKO_ID].updates).toEqual([
      {
        version: "1.0.0",
        update_link:
          "https://github.com/SebastienBobbia/whos-next-browser/releases/download/v1.0.0/whos-next-browser-1.0.0-firefox.xpi",
        update_hash: "sha256:abc123",
      },
    ]);
  });

  it("garde les versions précédentes et refuse d'annoncer deux fois la même", () => {
    const once = announce(empty(), "1.0.0", "a.xpi", "1");
    const twice = announce(once, "1.1.0", "b.xpi", "2");
    expect(twice.addons[GECKO_ID].updates.map((u) => u.version)).toEqual(["1.0.0", "1.1.0"]);
    expect(() => announce(twice, "1.1.0", "b.xpi", "2")).toThrow("déjà annoncée");
  });
});
