import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { loadImage } from "./storage";
import { parseTeamFile } from "./team-file";
import { TeamStore } from "./team.svelte";

// La réduction d'image passe par un canvas, absent des tests : on garde le contenu brut.
vi.mock("./images", () => ({
  prepareImage: async (file: Blob) => `data:text/plain,${await file.text()}`,
}));

const stores: TeamStore[] = [];

async function open(): Promise<TeamStore> {
  const store = new TeamStore();
  stores.push(store);
  await store.load();
  return store;
}

function names(store: TeamStore): string[] {
  return store.members.map((m) => m.name);
}

function imageId(store: TeamStore, name: string): string {
  const icon = store.members.find((m) => m.name === name)?.icon;
  if (icon?.type !== "image") throw new Error(`${name} n'a pas d'image`);
  return icon.id;
}

beforeEach(() => fakeBrowser.reset());
afterEach(() => stores.splice(0).forEach((s) => s.dispose()));

describe("TeamStore", () => {
  it("démarre avec une Équipe vide au premier lancement (PE-13)", async () => {
    expect((await open()).members).toEqual([]);
  });

  it("ajoute à la fin et enregistre tout de suite (EQ-08, PE-08)", async () => {
    const team = await open();
    expect(await team.add("  Camille ")).toEqual({ ok: true });
    await team.add("Adeline");
    expect(names(await open())).toEqual(["Camille", "Adeline"]);
  });

  it("refuse un nom vide ou déjà présent, casse ignorée, accents distincts (EQ-09, EQ-10)", async () => {
    const team = await open();
    await team.add("Loïc");
    expect(await team.add("   ")).toEqual({ ok: false, error: "Veuillez entrer un nom." });
    expect(await team.add("LOÏC")).toEqual({ ok: false, error: '"LOÏC" existe déjà dans l\'équipe.' });
    expect(await team.add("Loic")).toEqual({ ok: true });
  });

  it("réordonne par position d'insertion (EQ-13, EQ-14)", async () => {
    const team = await open();
    for (const name of ["A", "B", "C"]) await team.add(name);
    await team.reorder(0, 3);
    expect(names(team)).toEqual(["B", "C", "A"]);
    await team.reorder(2, 0);
    expect(names(team)).toEqual(["A", "B", "C"]);
    await team.reorder(1, 2);
    expect(names(team)).toEqual(["A", "B", "C"]);
    expect(names(await open())).toEqual(["A", "B", "C"]);
  });

  it("enregistre une image à part, avec le nom de son fichier (IC-11)", async () => {
    const team = await open();
    await team.add("Camille");
    await team.setImage("Camille", new File(["photo"], "czh.png"));

    const icon = (await open()).members[0]!.icon;
    expect(icon).toMatchObject({ type: "image", file: "czh.png" });
    expect(await loadImage(imageId(team, "Camille"))).toBe("data:text/plain,photo");
  });

  it("supprime l'ancienne image quand l'Icône change (IC-12)", async () => {
    const team = await open();
    await team.add("Camille");
    await team.setImage("Camille", new File(["v1"], "a.png"));
    const first = imageId(team, "Camille");

    await team.setImage("Camille", new File(["v2"], "b.png"));
    const second = imageId(team, "Camille");
    expect(second).not.toBe(first);
    expect(await loadImage(first)).toBeNull();
    expect(await loadImage(second)).toBe("data:text/plain,v2");

    await team.setEmoji("Camille", "🐱");
    expect(team.members[0]!.icon).toEqual({ type: "emoji", value: "🐱" });
    expect(await loadImage(second)).toBeNull();
  });

  it("retire l'Icône et son image (IC-09)", async () => {
    const team = await open();
    await team.add("Camille");
    await team.setImage("Camille", new File(["v1"], "a.png"));
    const id = imageId(team, "Camille");

    await team.clearIcon("Camille");
    expect(team.members[0]!.icon).toBeUndefined();
    expect(await loadImage(id)).toBeNull();
  });

  it("supprime un Membre avec son Icône et son Lien (EQ-12)", async () => {
    const team = await open();
    await team.add("Camille");
    await team.add("Marion");
    await team.setImage("Camille", new File(["v1"], "a.png"));
    await team.setLink("Camille", "https://jira.entreprise.com/");
    const id = imageId(team, "Camille");

    await team.remove("Camille");
    expect(names(await open())).toEqual(["Marion"]);
    expect(await loadImage(id)).toBeNull();
  });

  it("définit et retire un Lien (LI-07, LI-08)", async () => {
    const team = await open();
    await team.add("Camille");
    await team.setLink("Camille", "https://jira.entreprise.com/?quickFilter=5710#");
    expect((await open()).members[0]!.link).toBe("https://jira.entreprise.com/?quickFilter=5710#");

    await team.setLink("Camille", null);
    expect((await open()).members[0]).toEqual({ name: "Camille" });
  });

  it("enregistre les Absents au lancement d'une Session (PR-09)", async () => {
    const team = await open();
    for (const name of ["A", "B", "C"]) await team.add(name);
    await team.saveAbsents(["A", "C"]);
    expect((await open()).members.map((m) => m.absent ?? false)).toEqual([false, true, false]);

    await team.saveAbsents(["B"]);
    expect((await open()).members.map((m) => m.absent ?? false)).toEqual([true, false, true]);
  });

  it("démarre vide sur des données illisibles, sans les écraser avant une modification (PE-07)", async () => {
    await browser.storage.local.set({ team: { version: 99, members: "?" } });
    const team = await open();
    expect(team.members).toEqual([]);
    expect((await browser.storage.local.get("team")).team).toEqual({ version: 99, members: "?" });

    await team.add("Camille");
    expect(names(await open())).toEqual(["Camille"]);
  });

  it("exporte Membres, Icônes et Liens, sans les Absents (FI-02)", async () => {
    const team = await open();
    for (const name of ["Camille", "Loïc", "Marion"]) await team.add(name);
    await team.setImage("Camille", new File(["photo"], "czh.png"));
    await team.setEmoji("Loïc", "🐱");
    await team.setLink("Camille", "https://jira.entreprise.com/?quickFilter=5711#");
    await team.saveAbsents(["Camille", "Loïc"]);

    expect(parseTeamFile(await team.exportFile())).toEqual([
      {
        name: "Camille",
        icon: { type: "image", file: "czh.png", data: "data:text/plain,photo" },
        link: "https://jira.entreprise.com/?quickFilter=5711#",
      },
      { name: "Loïc", icon: { type: "emoji", value: "🐱" } },
      { name: "Marion" },
    ]);
  });

  it("remplace toute l'Équipe à l'import, anciennes images comprises (FI-05)", async () => {
    const team = await open();
    await team.add("Ancien");
    await team.setImage("Ancien", new File(["vieux"], "a.png"));
    const old = imageId(team, "Ancien");

    await team.replaceWith([
      { name: "Camille", icon: { type: "image", file: "czh.png", data: "data:image/png;base64,AAAA" } },
      { name: "Loïc", link: "https://jira.entreprise.com/" },
    ]);

    const reopened = await open();
    expect(names(reopened)).toEqual(["Camille", "Loïc"]);
    expect(reopened.members[1]!.link).toBe("https://jira.entreprise.com/");
    expect(await loadImage(imageId(reopened, "Camille"))).toBe("data:image/png;base64,AAAA");
    expect(await loadImage(old)).toBeNull();
  });

  it("garde les Absents dont le nom revient à l'import, casse ignorée (FI-06)", async () => {
    const team = await open();
    for (const name of ["Quentin", "Agnès", "Marion"]) await team.add(name);
    await team.saveAbsents(["Marion"]);

    await team.replaceWith([{ name: "QUENTIN" }, { name: "Marion" }, { name: "Nouveau" }]);
    expect((await open()).members.map((m) => [m.name, m.absent ?? false])).toEqual([
      ["QUENTIN", true],
      ["Marion", false],
      ["Nouveau", false],
    ]);
  });

  it("redonne la même Équipe après export puis import ailleurs (FI-09)", async () => {
    const team = await open();
    for (const name of ["Camille", "Loïc"]) await team.add(name);
    await team.setImage("Camille", new File(["photo"], "czh.png"));
    await team.setEmoji("Loïc", "🐱");
    await team.setLink("Loïc", "https://jira.entreprise.com/?quickFilter=5710#");
    const exported = await team.exportFile();

    fakeBrowser.reset();
    const colleague = await open();
    await colleague.replaceWith(parseTeamFile(exported)!);
    expect(await colleague.exportFile()).toBe(exported);
  });

  it("reprend une Équipe modifiée dans un autre panneau", async () => {
    const first = await open();
    const second = await open();
    await first.add("Camille");
    await vi.waitFor(() => expect(names(second)).toEqual(["Camille"]));
  });
});
