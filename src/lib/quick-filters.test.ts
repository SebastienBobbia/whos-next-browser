// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { setQuickFilters } from "./quick-filters";

/** Clics reçus par les boutons, dans l'ordre, sous la forme "+5710" ou "-5710". */
let clicks: string[];

/**
 * Reproduit les boutons de Filtre rapide de Jira Data Center 10.3, tels que
 * copiés depuis la page : un clic inverse aria-pressed et la classe ghx-active.
 */
function board(filters: Record<string, boolean>): void {
  document.body.innerHTML = Object.entries(filters)
    .map(
      ([id, active]) =>
        `<a role="button" href="#" aria-pressed="${active}" data-filter-id="${id}"` +
        ` class="js-quickfilter-button aui-button aui-button-link${active ? " ghx-active" : ""}">${id}</a>`,
    )
    .join("");
  for (const button of document.querySelectorAll<HTMLElement>(".js-quickfilter-button")) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const active = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("ghx-active", active);
      clicks.push(`${active ? "+" : "-"}${button.dataset.filterId}`);
    });
  }
}

function active(): string[] {
  return [...document.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map(
    (b) => b.dataset.filterId!,
  );
}

beforeEach(() => {
  clicks = [];
  document.body.innerHTML = "";
});

describe("setQuickFilters (LI-11)", () => {
  it("passe d'une personne à la suivante : décoche d'abord, puis coche", () => {
    board({ "5710": true, "5711": false, "5712": false });
    expect(setQuickFilters(["5711"])).toBe(true);
    expect(clicks).toEqual(["-5710", "+5711"]);
    expect(active()).toEqual(["5711"]);
  });

  it("décoche tous les Filtres rapides pour un Lien sans filtre", () => {
    board({ "5710": true, "5711": false, "1": true });
    expect(setQuickFilters([])).toBe(true);
    expect(active()).toEqual([]);
  });

  it("ne clique rien quand les bons Filtres sont déjà cochés", () => {
    board({ "5710": false, "5711": true });
    expect(setQuickFilters(["5711"])).toBe(true);
    expect(clicks).toEqual([]);
  });

  it("ne touche à rien si un Filtre demandé est introuvable (LI-15)", () => {
    board({ "5710": true });
    expect(setQuickFilters(["9999"])).toBe(false);
    expect(clicks).toEqual([]);
  });

  it("ne touche à rien sur une page sans Filtre rapide (LI-15)", () => {
    document.body.innerHTML = "<p>Chargement…</p>";
    expect(setQuickFilters([])).toBe(false);
  });

  it("ne clique qu'une fois un Filtre présent deux fois dans la page", () => {
    board({ "5710": false });
    document.body.insertAdjacentHTML(
      "beforeend",
      '<a class="js-quickfilter-button" aria-pressed="false" data-filter-id="5710">5710</a>',
    );
    expect(setQuickFilters(["5710"])).toBe(true);
    expect(clicks).toEqual(["+5710"]);
  });
});
