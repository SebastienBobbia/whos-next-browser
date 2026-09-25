import { describe, expect, it } from "vitest";
import { parseTeamFile, serializeTeamFile, teamFile, teamFileName } from "./team-file";

const LINK = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&quickFilter=5710#";

function file(members: unknown[], extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ format: "whos-next-equipe", version: 1, members, ...extra });
}

describe("Fichier d'Équipe", () => {
  it("s'écrit en JSON indenté, accents et emojis tels quels (FI-03)", () => {
    const text = serializeTeamFile(teamFile([{ name: "Loïc", icon: { type: "emoji", value: "🐱" } }]));
    expect(text).toContain('\n  "members": [');
    expect(text).toContain("Loïc");
    expect(text).toContain("🐱");
    expect(text).not.toContain("\\u");
  });

  it("se relit à l'identique (FI-09)", () => {
    const members = [
      { name: "Camille", icon: { type: "image" as const, file: "czh.png", data: "data:image/png;base64,AAAA" }, link: LINK },
      { name: "Loïc", icon: { type: "emoji" as const, value: "🐱" } },
      { name: "Marion" },
    ];
    expect(parseTeamFile(serializeTeamFile(teamFile(members)))).toEqual(members);
  });

  it("porte la date du jour dans son nom (FI-02)", () => {
    expect(teamFileName(new Date(2026, 8, 5))).toBe("whos-next-equipe-20260905.json");
  });

  it("refuse un fichier illisible (FI-07)", () => {
    expect(parseTeamFile("pas du JSON")).toBeNull();
    expect(parseTeamFile("[]")).toBeNull();
    expect(parseTeamFile(file([], { format: "autre" }))).toBeNull();
    expect(parseTeamFile(file([], { version: 2 }))).toBeNull();
    expect(parseTeamFile(JSON.stringify({ format: "whos-next-equipe", version: 1, members: "?" }))).toBeNull();
    // Le team.json de l'application de bureau n'est pas un Fichier d'Équipe.
    expect(parseTeamFile(JSON.stringify({ version: 2, members: [{ name: "Alice" }] }))).toBeNull();
  });

  it("ignore ce qui est inutilisable, membre par membre (FI-08)", () => {
    const members = parseTeamFile(
      file([
        { name: "  Camille ", extra: true },
        { name: "   " },
        { icon: { type: "emoji", value: "🐱" } },
        "Alice",
        { name: "Loïc", icon: { type: "sticker", value: "?" }, link: "jira.entreprise.com" },
        { name: "Marion", icon: { type: "image", file: "m.png" }, link: ` ${LINK} ` },
        { name: "Yoann", icon: { type: "image", data: "data:image/png;base64,AAAA" } },
      ]),
    );
    expect(members).toEqual([
      { name: "Camille" },
      { name: "Loïc" },
      { name: "Marion", link: LINK },
      { name: "Yoann", icon: { type: "image", file: "image", data: "data:image/png;base64,AAAA" } },
    ]);
  });

  it("garde les noms qui ne diffèrent que par la casse, pas un nom répété (EQ-10)", () => {
    const members = parseTeamFile(file([{ name: "Alice" }, { name: "alice" }, { name: "Alice" }]));
    expect(members?.map((m) => m.name)).toEqual(["Alice", "alice"]);
  });
});
