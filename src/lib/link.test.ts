import { describe, expect, it } from "vitest";
import { parseLink } from "./link";

const JIRA =
  "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&projectKey=COP&quickFilter=5710#";

describe("parseLink (LI-06)", () => {
  it("garde l'adresse telle quelle, fragment compris", () => {
    expect(parseLink(JIRA)).toBe(JIRA);
    expect(parseLink("http://intranet.local/page")).toBe("http://intranet.local/page");
    expect(parseLink("HTTPS://Exemple.com/A")).toBe("HTTPS://Exemple.com/A");
  });

  it("retire les espaces de début et de fin", () => {
    expect(parseLink(`  ${JIRA}\n`)).toBe(JIRA);
  });

  it("refuse ce qui n'est pas une adresse absolue en http ou https", () => {
    expect(parseLink("")).toBeNull();
    expect(parseLink("jira.entreprise.com/secure/RapidBoard.jspa")).toBeNull();
    expect(parseLink("ftp://exemple.com/fichier")).toBeNull();
    expect(parseLink("javascript:alert(1)")).toBeNull();
    expect(parseLink("https://")).toBeNull();
  });
});
