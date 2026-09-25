import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseTeamFile } from "../src/lib/team-file";
import { convertDesktopData } from "./team-file-from-desktop.mjs";

let dir;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "whos-next-"));
  fs.mkdirSync(path.join(dir, "icons"));
});

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("convertDesktopData", () => {
  it("produit un Fichier d'Équipe que l'extension accepte, sans les Absents", () => {
    fs.writeFileSync(path.join(dir, "icons", "czh.png"), Buffer.from([137, 80, 78, 71]));
    fs.writeFileSync(
      path.join(dir, "team.json"),
      JSON.stringify({
        version: 2,
        members: [
          { name: "Camille", icon_type: "image", icon_value: "czh.png" },
          { name: "Loïc", icon_type: "emoji", icon_value: "🐱", absent: true },
          { name: "Marion", icon_type: "image", icon_value: "absente.png" },
          { name: "", icon_type: "", icon_value: "" },
        ],
      }),
    );

    const file = convertDesktopData(dir);
    expect(parseTeamFile(JSON.stringify(file))).toEqual([
      { name: "Camille", icon: { type: "image", file: "czh.png", data: "data:image/png;base64,iVBORw==" } },
      { name: "Loïc", icon: { type: "emoji", value: "🐱" } },
      { name: "Marion" },
    ]);
  });

  it("refuse un team.json qui n'est pas au format v2", () => {
    fs.writeFileSync(path.join(dir, "team.json"), JSON.stringify({ members: ["Alice"] }));
    expect(() => convertDesktopData(dir)).toThrow("format v2");
  });
});
