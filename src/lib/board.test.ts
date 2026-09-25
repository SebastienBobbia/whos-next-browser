import { describe, expect, it } from "vitest";
import { boardKey, jiraOrigin, jiraQuickFilters } from "./board";

const BOARD = "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&projectKey=COP";

describe("boardKey (LI-10)", () => {
  it("reconnaît le même Tableau Jira quels que soient les Filtres rapides et le ticket ouvert", () => {
    const key = boardKey(BOARD);
    expect(boardKey(`${BOARD}&quickFilter=5710#`)).toBe(key);
    expect(boardKey(`${BOARD}&quickFilter=5710&quickFilter=5711`)).toBe(key);
    expect(boardKey(`${BOARD}&quickFilter=5710&selectedIssue=COP-12`)).toBe(key);
    expect(boardKey("https://jira.entreprise.com/secure/RapidBoard.jspa?projectKey=COP&rapidView=528")).toBe(key);
  });

  it("distingue un autre Tableau, un autre site ou un autre protocole", () => {
    const key = boardKey(BOARD);
    expect(boardKey(BOARD.replace("528", "999"))).not.toBe(key);
    expect(boardKey(BOARD.replace("jira.", "jira2."))).not.toBe(key);
    expect(boardKey(BOARD.replace("https:", "http:"))).not.toBe(key);
  });

  it("compare une autre adresse en entier, sauf le fragment", () => {
    expect(boardKey("https://gitlab.entreprise.com/cop/-/issues?assignee=a#top")).toBe(
      boardKey("https://gitlab.entreprise.com/cop/-/issues?assignee=a"),
    );
    expect(boardKey("https://gitlab.entreprise.com/cop/-/issues?assignee=a")).not.toBe(
      boardKey("https://gitlab.entreprise.com/cop/-/issues?assignee=b"),
    );
  });

  it("ne reconnaît aucun Tableau hors d'une page web", () => {
    expect(boardKey(undefined)).toBeNull();
    expect(boardKey("about:blank")).toBeNull();
    expect(boardKey("chrome://extensions/")).toBeNull();
  });
});

describe("jiraQuickFilters (LI-11)", () => {
  it("lit les Filtres rapides d'un Lien vers un Tableau Jira", () => {
    expect(jiraQuickFilters(`${BOARD}&quickFilter=5710#`)).toEqual(["5710"]);
    expect(jiraQuickFilters(`${BOARD}&quickFilter=5710&quickFilter=42`)).toEqual(["5710", "42"]);
  });

  it("rend une liste vide pour le Tableau sans Filtre rapide", () => {
    expect(jiraQuickFilters(BOARD)).toEqual([]);
  });

  it("rend null hors d'un Tableau Jira", () => {
    expect(jiraQuickFilters("https://jira.entreprise.com/browse/COP-12")).toBeNull();
    expect(jiraQuickFilters("https://jira.entreprise.com/secure/RapidBoard.jspa")).toBeNull();
    expect(jiraQuickFilters("https://gitlab.entreprise.com/?quickFilter=1")).toBeNull();
  });
});

describe("jiraOrigin (LI-16)", () => {
  it("donne le site d'un Tableau Jira, et rien pour une autre adresse", () => {
    expect(jiraOrigin(`${BOARD}&quickFilter=5710`)).toBe("https://jira.entreprise.com");
    expect(jiraOrigin("https://gitlab.entreprise.com/cop")).toBeNull();
  });
});
