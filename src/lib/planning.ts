/**
 * Synchronisation avec le Planning WebplanningRD (PR-11 à PR-16, PE-14, ADR 0005).
 *
 * - L'adresse du Planning (`planningUrl`) est stockée avec l'Équipe et voyage dans le Fichier d'Équipe.
 * - L'autorisation d'accès à l'hôte est vérifiée / demandée via `browser.permissions`.
 * - La lecture tente d'abord `Scheduler.aspx` avec les cookies du navigateur (`credentials: "include"`),
 *   puis en cas de redirection vers `Identification.aspx`, s'authentifie avec `planning_auth` (`storage.local`).
 */
import { browser } from "wxt/browser";
import { loadPlanningAuth, savePlanningAuth } from "./storage";
import {
  normalizePlanningName,
  type PlanningMemberStatus,
  type PlanningResult,
} from "./types";

type RawResource = {
  id: string;
  name: string;
};

type RawEvent = {
  resource: string;
  start: string;
  end: string;
  text?: string;
  tag?: string[];
};

export type ResolvedPlanningUrls = {
  originPattern: string;
  baseUrl: string;
  loginUrl: string;
  schedulerUrl: string;
};

/**
 * Déduit les URLs `Identification.aspx` et `Sched/Scheduler.aspx` à partir de
 * n'importe quelle URL du WebPlanning (racine `/WebplanningRD`, `Identification.aspx?...` ou `Scheduler.aspx`).
 */
export function resolvePlanningUrls(rawUrl: string): ResolvedPlanningUrls | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  let path = url.pathname.replace(/\/+$/, "");
  const lower = path.toLowerCase();
  if (lower.endsWith("/sched/scheduler.aspx")) {
    path = path.slice(0, -"/sched/scheduler.aspx".length);
  } else if (lower.endsWith("/identification.aspx")) {
    path = path.slice(0, -"/identification.aspx".length);
  }

  const basePath = path || "";
  const baseUrl = `${url.origin}${basePath}`;
  const returnUrl = encodeURIComponent(`${basePath}/Sched/Scheduler.aspx`);

  return {
    originPattern: `${url.origin}/*`,
    baseUrl,
    loginUrl: `${baseUrl}/Identification.aspx?ReturnUrl=${returnUrl}`,
    schedulerUrl: `${baseUrl}/Sched/Scheduler.aspx`,
  };
}

/**
 * Demande l'autorisation d'accès à l'hôte du Planning (PR-12).
 * À appeler de façon synchrone au début d'un geste utilisateur (clic) avant tout `await`.
 */
export function requestPlanningAccess(rawUrl: string | undefined): Promise<boolean> {
  if (!rawUrl) return Promise.resolve(false);
  const urls = resolvePlanningUrls(rawUrl);
  if (!urls) return Promise.resolve(false);
  return browser.permissions.request({ origins: [urls.originPattern] }).catch(() => false);
}

/** Vérifie si l'extension a déjà l'autorisation d'accéder à l'hôte du Planning. */
export async function hasPlanningAccess(rawUrl: string): Promise<boolean> {
  const urls = resolvePlanningUrls(rawUrl);
  if (!urls) return false;
  try {
    return await browser.permissions.contains({ origins: [urls.originPattern] });
  } catch {
    return false;
  }
}

/** Extrait la catégorie sans crochets ni détail : `"[Absence] <br>RTT"` -> `"Absence"` (PR-14). */
export function extractCategory(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) {
    const closeIdx = trimmed.indexOf("]");
    if (closeIdx > 1) {
      const cat = trimmed.slice(1, closeIdx).trim();
      if (cat) return cat;
    }
  }
  const beforeBr = trimmed.split(/<br\s*\/?>/i)[0]?.trim() ?? "";
  return beforeBr || null;
}

/** Indique si l'événement doit être ignoré (`[Activité autre]` / `x_id_type_rdv === "18"`, PR-14). */
function isIgnoredEvent(event: RawEvent, category: string): boolean {
  if (event.tag?.[1] === "18") return true;
  return normalizePlanningName(category) === "activite autre";
}

/** Priorité : absences journée/demi-journée (`0`) avant réunions (`1`) (PR-14). */
function categoryPriority(event: RawEvent, category: string): number {
  const typeId = event.tag?.[1];
  if (typeId === "17" || typeId === "30" || typeId === "38") return 0;
  const norm = normalizePlanningName(category);
  if (norm.startsWith("absence") || norm.startsWith("ferie")) return 0;
  return 1;
}

function extractJsAssignment(html: string, marker: string): string | null {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const rest = html.slice(idx + marker.length).trimStart();
  const endIdx = rest.search(/;\s*(\r?\n|$)/);
  const slice = endIdx !== -1 ? rest.slice(0, endIdx) : rest.split(";")[0];
  return slice?.trim() ?? null;
}

/**
 * Analyse le HTML de `Scheduler.aspx` pour la date `dateIso` (`AAAA-MM-JJ`) sur le créneau 09h15–10h00 (PR-14).
 */
export function parseSchedulerHtml(
  html: string,
  dateIso: string,
): Record<string, PlanningMemberStatus> | null {
  const resourcesJson = extractJsAssignment(html, "v.resources =");
  const eventsJson = extractJsAssignment(html, "v.events.list =");
  if (!resourcesJson || !eventsJson) return null;

  let rawResources: RawResource[];
  let rawEvents: RawEvent[];
  try {
    rawResources = JSON.parse(resourcesJson);
    rawEvents = JSON.parse(eventsJson);
  } catch {
    return null;
  }
  if (!Array.isArray(rawResources) || !Array.isArray(rawEvents)) return null;

  const slotStart = `${dateIso}T09:15:00`;
  const slotEnd = `${dateIso}T10:00:00`;

  const bestByResource = new Map<string, { prio: number; start: string; category: string }>();

  for (const ev of rawEvents) {
    if (!ev || typeof ev.start !== "string" || typeof ev.end !== "string") continue;
    if (ev.start < slotEnd && ev.end > slotStart) {
      const category = extractCategory(ev.text ?? "");
      if (!category || isIgnoredEvent(ev, category)) continue;
      const prio = categoryPriority(ev, category);
      const current = bestByResource.get(ev.resource);
      if (
        !current ||
        prio < current.prio ||
        (prio === current.prio && ev.start < current.start)
      ) {
        bestByResource.set(ev.resource, { prio, start: ev.start, category });
      }
    }
  }

  const result: Record<string, PlanningMemberStatus> = {};
  for (const res of rawResources) {
    if (!res || typeof res.name !== "string" || typeof res.id !== "string") continue;
    const key = normalizePlanningName(res.name);
    if (!key) continue;
    const best = bestByResource.get(res.id);
    if (best) {
      result[key] = { unavailable: true, status: best.category };
    } else {
      result[key] = { unavailable: false };
    }
  }

  return result;
}

function extractInputValue(html: string, inputId: string): string {
  const idPattern = `id="${inputId}"`;
  const idPos = html.indexOf(idPattern);
  if (idPos === -1) return "";
  const tagStart = html.lastIndexOf("<", idPos);
  const tagEnd = html.indexOf(">", idPos);
  if (tagStart === -1 || tagEnd === -1) return "";
  const tag = html.slice(tagStart, tagEnd + 1);
  const match = /value="([^"]*)"/.exec(tag);
  if (!match?.[1]) return "";
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Exécuté directement DANS un onglet du serveur WebPlanning via `browser.scripting.executeScript`.
 * Doit être 100 % autonome (aucune référence externe).
 *
 * Contourne le Mode HTTPS-Only / Mixed-Content de Firefox sur `http://10.64.101.2`
 * car les requêtes sont same-origin par rapport à l'onglet `http://10.64.101.2/...`.
 */
async function inPageFetchSchedulerHtml(
  schedulerUrl: string,
  loginUrl: string,
  username: string,
  password: string,
): Promise<{ status: "ok"; html: string } | { status: "auth_required" } | { status: "auth_failed" } | { status: "error"; message: string }> {
  function extractInput(html: string, id: string): string {
    const idPos = html.indexOf(`id="${id}"`);
    if (idPos === -1) return "";
    const start = html.lastIndexOf("<", idPos);
    const end = html.indexOf(">", idPos);
    if (start === -1 || end === -1) return "";
    const m = /value="([^"]*)"/.exec(html.slice(start, end + 1));
    return m?.[1] ?? "";
  }

  try {
    // 1. Si l'onglet courant affiche déjà Scheduler.aspx avec les données chargées
    const currentHtml = document.documentElement?.outerHTML ?? "";
    if (currentHtml.includes("v.resources =") && currentHtml.includes("v.events.list =")) {
      return { status: "ok", html: currentHtml };
    }

    // 2. Essai direct en same-origin avec les cookies du navigateur
    const directResp = await fetch(schedulerUrl, { credentials: "include" });
    const directHtml = await directResp.text();
    if (directHtml.includes("v.resources =") && directHtml.includes("v.events.list =")) {
      return { status: "ok", html: directHtml };
    }

    // 3. Non authentifié : si pas d'identifiants fournis, demander les identifiants
    if (!username || !password) {
      return { status: "auth_required" };
    }

    let loginHtml = directHtml;
    if (!loginHtml.includes("__VIEWSTATE")) {
      const loginGet = await fetch(loginUrl, { credentials: "include" });
      loginHtml = await loginGet.text();
    }

    const body = new URLSearchParams({
      ToolkitScriptManager1_HiddenField: "",
      __EVENTTARGET: "",
      __EVENTARGUMENT: "",
      __VIEWSTATE: extractInput(loginHtml, "__VIEWSTATE"),
      __VIEWSTATEGENERATOR: extractInput(loginHtml, "__VIEWSTATEGENERATOR"),
      __EVENTVALIDATION: extractInput(loginHtml, "__EVENTVALIDATION"),
      ctl00$ContentPlaceHolder1$Login1$UserName: username,
      ctl00$ContentPlaceHolder1$Login1$Password: password,
      ctl00$ContentPlaceHolder1$Login1$RememberMe: "on",
      ctl00$ContentPlaceHolder1$Login1$LoginButton: "Log In",
    });

    const postResp = await fetch(loginUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const postHtml = await postResp.text();
    if (postHtml.includes("v.resources =") && postHtml.includes("v.events.list =")) {
      return { status: "ok", html: postHtml };
    }

    const schedResp = await fetch(schedulerUrl, { credentials: "include" });
    const schedHtml = await schedResp.text();
    if (schedHtml.includes("v.resources =") && schedHtml.includes("v.events.list =")) {
      return { status: "ok", html: schedHtml };
    }

    return { status: "auth_failed" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

async function waitForTabComplete(tabId: number, timeoutMs = 8000): Promise<void> {
  const tab = await browser.tabs.get(tabId).catch(() => null);
  if (!tab || tab.status === "complete") return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(listener);
      resolve();
    }, timeoutMs);
    function listener(updatedId: number, changeInfo: { status?: string }) {
      if (updatedId === tabId && changeInfo.status === "complete") {
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    browser.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Interroge le Planning depuis un onglet same-origin (existant ou temporaire en arrière-plan)
 * lorsque le `fetch` direct de l'extension est bloqué par le Mode HTTPS-Only de Firefox sur `http://`.
 */
async function fetchViaPageTab(
  urls: ResolvedPlanningUrls,
  planningUrl: string,
  username: string,
  password: string,
  dateIso: string,
): Promise<PlanningResult> {
  const originPrefix = new URL(urls.baseUrl).origin;
  const allTabs = await browser.tabs.query({});
  const existingTab = allTabs.find((t) => t.id !== undefined && t.url?.startsWith(originPrefix));

  let tabId: number | undefined = existingTab?.id;
  let createdTempTab = false;

  try {
    if (tabId === undefined) {
      const created = await browser.tabs.create({ url: urls.loginUrl, active: false });
      tabId = created.id;
      createdTempTab = true;
      if (tabId !== undefined) {
        await waitForTabComplete(tabId);
      }
    }

    if (tabId === undefined) {
      return { state: "error", planningUrl, message: "Impossible d'ouvrir l'accès au planning." };
    }

    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: inPageFetchSchedulerHtml,
      args: [urls.schedulerUrl, urls.loginUrl, username, password],
    });

    const res = injection?.result;
    if (!res) {
      return { state: "error", planningUrl, message: "Aucune réponse de la page du planning." };
    }
    if (res.status === "auth_required") {
      return { state: "auth_required", planningUrl };
    }
    if (res.status === "auth_failed") {
      return { state: "auth_failed", planningUrl, username };
    }
    if (res.status === "error") {
      return { state: "error", planningUrl, message: `Planning injoignable (${res.message}).` };
    }

    const parsed = parseSchedulerHtml(res.html, dateIso);
    if (!parsed) {
      return { state: "error", planningUrl, message: "Format du planning non reconnu." };
    }
    return { state: "ready", planningUrl, resources: parsed };
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
    return { state: "error", planningUrl, message: `Planning injoignable${detail}.` };
  } finally {
    if (createdTempTab && tabId !== undefined) {
      await browser.tabs.remove(tabId).catch(() => {});
    }
  }
}

/**
 * Exécution effective de la requête vers le Planning.
 * 1. Tente `GET Scheduler.aspx` directement avec les cookies du navigateur (`credentials: "include"`).
 * 2. Si redirigé vers `Identification.aspx`, s'authentifie avec les identifiants de `storage.local`.
 * 3. Si Firefox bloque le `fetch` direct sur `http://` (HTTPS-Only mode / NetworkError), bascule
 *    automatiquement sur une exécution same-origin dans un onglet du serveur (`fetchViaPageTab`).
 */
export async function fetchPlanning(
  planningUrl: string | undefined,
  now: Date = new Date(),
): Promise<PlanningResult> {
  if (!planningUrl) return { state: "unconfigured" };
  const urls = resolvePlanningUrls(planningUrl);
  if (!urls) {
    return { state: "error", planningUrl, message: "Adresse du planning invalide." };
  }

  if (!(await hasPlanningAccess(planningUrl))) {
    return { state: "missing_permission", planningUrl };
  }

  const dateIso = todayIso(now);
  const auth = await loadPlanningAuth();

  try {
    // 1. Essai direct avec la session active du navigateur
    const directResp = await fetch(urls.schedulerUrl, { credentials: "include" });
    const directHtml = await directResp.text();
    const directParsed = parseSchedulerHtml(directHtml, dateIso);
    if (directParsed) {
      return { state: "ready", planningUrl, resources: directParsed };
    }

    // 2. Session non connectée : vérifier si on a des identifiants enregistrés
    if (!auth) {
      return { state: "auth_required", planningUrl };
    }

    return await loginAndFetch(urls, planningUrl, auth.username, auth.password, directHtml, dateIso);
  } catch {
    // 3. Repli same-origin via scripting.executeScript (contourne le blocage HTTP / HTTPS-Only de Firefox)
    return await fetchViaPageTab(
      urls,
      planningUrl,
      auth?.username ?? "",
      auth?.password ?? "",
      dateIso,
    );
  }
}

async function loginAndFetch(
  urls: ResolvedPlanningUrls,
  planningUrl: string,
  username: string,
  password: string,
  initialLoginHtml?: string,
  dateIso: string = todayIso(),
): Promise<PlanningResult> {
  let loginHtml = initialLoginHtml;
  if (!loginHtml || !loginHtml.includes("__VIEWSTATE")) {
    const loginGet = await fetch(urls.loginUrl, { credentials: "include" });
    loginHtml = await loginGet.text();
  }

  const body = new URLSearchParams({
    ToolkitScriptManager1_HiddenField: "",
    __EVENTTARGET: "",
    __EVENTARGUMENT: "",
    __VIEWSTATE: extractInputValue(loginHtml, "__VIEWSTATE"),
    __VIEWSTATEGENERATOR: extractInputValue(loginHtml, "__VIEWSTATEGENERATOR"),
    __EVENTVALIDATION: extractInputValue(loginHtml, "__EVENTVALIDATION"),
    ctl00$ContentPlaceHolder1$Login1$UserName: username,
    ctl00$ContentPlaceHolder1$Login1$Password: password,
    ctl00$ContentPlaceHolder1$Login1$RememberMe: "on",
    ctl00$ContentPlaceHolder1$Login1$LoginButton: "Log In",
  });

  const postResp = await fetch(urls.loginUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const postHtml = await postResp.text();
  const parsedFromPost = parseSchedulerHtml(postHtml, dateIso);
  if (parsedFromPost) {
    return { state: "ready", planningUrl, resources: parsedFromPost };
  }

  // Au cas où la redirection vers Scheduler.aspx n'a pas été suivie automatiquement
  const schedResp = await fetch(urls.schedulerUrl, { credentials: "include" });
  const schedHtml = await schedResp.text();
  const parsedFromSched = parseSchedulerHtml(schedHtml, dateIso);
  if (parsedFromSched) {
    return { state: "ready", planningUrl, resources: parsedFromSched };
  }

  return { state: "auth_failed", planningUrl, username };
}

/**
 * Enregistre les identifiants (optionnels si l'utilisateur est déjà connecté dans le navigateur)
 * et lance immédiatement la synchronisation.
 */
export async function saveConfigAndFetchPlanning(
  planningUrl: string,
  username: string,
  password: string,
  now: Date = new Date(),
): Promise<PlanningResult> {
  if (username.trim() && password) {
    await savePlanningAuth({ username: username.trim(), password });
  } else if (!username.trim() && !password) {
    await savePlanningAuth(null);
  }
  return fetchPlanning(planningUrl, now);
}
