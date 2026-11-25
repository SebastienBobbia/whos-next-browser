import { describe, expect, it } from "vitest";
import { extractCategory, parseSchedulerHtml, resolvePlanningUrls } from "./planning";
import { normalizePlanningName } from "./types";

describe("Planning WebplanningRD", () => {
  it("normalise les prénoms et initiales (PR-13)", () => {
    expect(normalizePlanningName("Julien Bl.")).toBe("julien bl");
    expect(normalizePlanningName("JULIEN BL")).toBe("julien bl");
    expect(normalizePlanningName("Clémence")).toBe("clemence");
    expect(normalizePlanningName("CLEMENCE")).toBe("clemence");
    expect(normalizePlanningName("Loïc")).toBe("loic");
    expect(normalizePlanningName("MAÏLYS")).toBe("mailys");
    expect(normalizePlanningName("Mailys")).toBe("mailys");
    expect(normalizePlanningName("Pierre-Yves")).toBe("pierre-yves");
    expect(normalizePlanningName("Sébastien")).toBe("sebastien");
  });

  it("déduit les URLs du planning depuis la racine, Identification.aspx ou Scheduler.aspx", () => {
    const fromRoot = resolvePlanningUrls("http://10.64.101.2/WebplanningRD");
    const fromLogin = resolvePlanningUrls(
      "http://10.64.101.2/WebplanningRD/Identification.aspx?ReturnUrl=%2fWebplanningRD%2fSched%2fScheduler.aspx",
    );
    const fromSched = resolvePlanningUrls(
      "http://10.64.101.2/WebplanningRD/Sched/Scheduler.aspx",
    );
    expect(fromRoot).toEqual({
      originPattern: "http://10.64.101.2/*",
      baseUrl: "http://10.64.101.2/WebplanningRD",
      loginUrl:
        "http://10.64.101.2/WebplanningRD/Identification.aspx?ReturnUrl=%2FWebplanningRD%2FSched%2FScheduler.aspx",
      schedulerUrl: "http://10.64.101.2/WebplanningRD/Sched/Scheduler.aspx",
    });
    expect(fromLogin).toEqual(fromRoot);
    expect(fromSched).toEqual(fromRoot);
  });

  it("extrait uniquement la catégorie sans crochets ni détail (PR-14)", () => {
    expect(extractCategory("[Absence] <br>RTT")).toBe("Absence");
    expect(extractCategory("[Absence] <br>")).toBe("Absence");
    expect(extractCategory("[Réunion Interne R&D] <br>Lancement modernisation")).toBe(
      "Réunion Interne R&D",
    );
    expect(extractCategory("[Absence prév.] <br>Congés de Noel")).toBe("Absence prév.");
  });

  it("détecte les indisponibilités sur 09h15–10h00 et ignore après-midi et [Activité autre] (PR-14)", () => {
    const html = `
      <script type="text/javascript">
      function sched_Init() {
      var v = new DayPilot.Scheduler('ContentPlaceHolder1_sched');
      v.events.list = [
        {"end":"2026-11-26T00:00:00","start":"2026-11-25T00:00:00","resource":"76","id":"1","tag":["","30","","Temps partiel","","0",""],"text":"[Absence] <br>Temps partiel"},
        {"end":"2026-11-25T12:00:00","start":"2026-11-25T00:00:00","resource":"83","id":"2","tag":["","25","","Lancement","","0",""],"text":"[Réunion Interne R&D] <br>Lancement"},
        {"end":"2026-11-26T00:00:00","start":"2026-11-25T12:00:00","resource":"82","id":"3","tag":["","30","","RTT","","0",""],"text":"[Absence] <br>RTT"},
        {"end":"2026-11-26T00:00:00","start":"2026-11-25T00:00:00","resource":"84","id":"4","tag":["","18","","Début de sprint","","0",""],"text":"[Activité autre] <br>Début de sprint"}
      ];
      v.resources = [
        {"id":"76","name":"ADELINE"},
        {"id":"83","name":"MARION"},
        {"id":"82","name":"RENAUD"},
        {"id":"84","name":"SEBASTIEN"}
      ];
      }
      </script>
    `;

    expect(parseSchedulerHtml(html, "2026-11-25")).toEqual({
      adeline: { unavailable: true, status: "Absence" },
      marion: { unavailable: true, status: "Réunion Interne R&D" },
      renaud: { unavailable: false },
      sebastien: { unavailable: false },
    });
  });

  it("priorise une absence sur une réunion quand les deux chevauchent le daily (PR-14)", () => {
    const html = `
      <script>
      v.events.list = [
        {"end":"2026-11-25T10:00:00","start":"2026-11-25T09:00:00","resource":"18","id":"1","tag":["","25","","Point","","0",""],"text":"[Réunion Interne R&D] <br>Point"},
        {"end":"2026-11-26T00:00:00","start":"2026-11-25T00:00:00","resource":"18","id":"2","tag":["","30","","Congés","","0",""],"text":"[Absence] <br>Congés"}
      ];
      v.resources = [{"id":"18","name":"JULIEN BL"}];
      </script>
    `;

    expect(parseSchedulerHtml(html, "2026-11-25")).toEqual({
      "julien bl": { unavailable: true, status: "Absence" },
    });
  });
});
