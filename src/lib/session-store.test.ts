import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browser } from "wxt/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { SessionStore } from "./session.svelte";

const TEAM = ["Adeline", "Camille", "Marion"];

const stores: SessionStore[] = [];

async function open(): Promise<SessionStore> {
  const store = new SessionStore();
  stores.push(store);
  await store.load();
  return store;
}

async function stored(): Promise<unknown> {
  return (await browser.storage.session.get("session")).session;
}

beforeEach(() => fakeBrowser.reset());
afterEach(() => stores.splice(0).forEach((s) => s.dispose()));

describe("SessionStore", () => {
  it("n'a aucune Session au départ", async () => {
    expect((await open()).state).toBeNull();
  });

  it("met à jour l'affichage avant d'enregistrer (PF-02, PF-16)", async () => {
    const session = await open();
    await session.start(TEAM);
    const saving = session.markSpoken("Camille");
    expect(session.state?.remaining).toEqual(["Adeline", "Marion"]);
    expect(await saving).toBe(true);
  });

  it("conserve la Session quand le panneau se ferme (SE-17)", async () => {
    const first = await open();
    await first.start(TEAM);
    await first.markSpoken("Adeline");
    await first.draw();
    const designated = first.state?.designated;
    first.dispose();

    const reopened = await open();
    expect(reopened.state).toMatchObject({
      attendees: TEAM,
      remaining: ["Camille", "Marion"],
      designated,
      complete: false,
      canUndo: true,
    });
  });

  it("oublie une Session dont la Célébration a été interrompue (SE-10)", async () => {
    const first = await open();
    await first.start(["Adeline"]);
    await first.markSpoken("Adeline");
    expect(first.state).toMatchObject({ complete: true, canUndo: false, canDraw: false });

    expect((await open()).state).toBeNull();
    expect(await stored()).toBeUndefined();
  });

  it("n'annule rien pendant la Célébration (SE-08)", async () => {
    const session = await open();
    await session.start(["Adeline"]);
    await session.markSpoken("Adeline");
    await session.undo();
    expect(session.state?.complete).toBe(true);
  });

  it("oublie la Session au bouton de fin (SE-09)", async () => {
    const session = await open();
    await session.start(TEAM);
    await session.end();
    expect(session.state).toBeNull();
    expect(await stored()).toBeUndefined();
  });

  it("partage la Session entre les panneaux de plusieurs fenêtres (SE-18)", async () => {
    const first = await open();
    const second = await open();
    await first.start(TEAM);
    await vi.waitFor(() => expect(second.state?.remaining).toEqual(TEAM));

    await second.markSpoken("Marion");
    await vi.waitFor(() => expect(first.state?.remaining).toEqual(["Adeline", "Camille"]));

    await first.end();
    await vi.waitFor(() => expect(second.state).toBeNull());
  });
});
