<script lang="ts">
  import { onMount } from "svelte";
  import Glyph from "../lib/Glyph.svelte";
  import MemberIcon from "../lib/MemberIcon.svelte";
  import {
    fetchPlanning,
    hasPlanningAccess,
    requestPlanningAccess,
    saveConfigAndFetchPlanning,
  } from "../lib/planning";
  import { loadPlanningAuth } from "../lib/storage";
  import { requestBoardAccess } from "../lib/tabs";
  import { team } from "../lib/team.svelte";
  import { normalizePlanningName, type PlanningResult } from "../lib/types";

  let { onBack, onStart }: { onBack: () => void; onStart: (attendees: string[]) => void } =
    $props();

  const activeMembers = $derived(team.members.filter((m) => !m.disabled));

  // Coché par défaut, sauf pour les Absents du dernier daily (PR-04).
  let checked = $state<Record<string, boolean>>(
    Object.fromEntries(team.members.filter((m) => !m.disabled).map((m) => [m.name, !m.absent])),
  );

  // Statut Planning affiché à côté du prénom (PR-14, PR-16).
  let statuses = $state<Record<string, string>>({});
  let planningLoading = $state(false);
  let planningState = $state<PlanningResult["state"] | "idle">("idle");
  let planningError = $state("");

  // Modale de configuration du Planning (PR-12, PE-14).
  let showConfigDialog = $state(false);
  let configUrl = $state("");
  let configUsername = $state("");
  let configPassword = $state("");
  let configSaving = $state(false);
  let configError = $state("");

  const present = $derived(activeMembers.filter((m) => checked[m.name]).map((m) => m.name));

  function setAll(value: boolean) {
    checked = Object.fromEntries(activeMembers.map((m) => [m.name, value]));
  }

  function applyPlanningResult(res: PlanningResult) {
    planningState = res.state;
    if (res.state === "error") {
      planningError = res.message;
      return;
    }
    planningError = "";
    if (res.state !== "ready") return;

    const nextChecked = { ...checked };
    const nextStatuses: Record<string, string> = {};

    for (const member of activeMembers) {
      const key = normalizePlanningName(member.name);
      const entry = res.resources[key];
      if (!entry) {
        // PR-15 : Membre absent des ressources du Planning -> on conserve l'état issu de l'Équipe.
        continue;
      }
      if (entry.unavailable) {
        nextChecked[member.name] = false;
        if (entry.status) nextStatuses[member.name] = entry.status;
      } else {
        nextChecked[member.name] = true;
      }
    }

    checked = nextChecked;
    statuses = nextStatuses;
  }

  async function syncPlanning() {
    if (!team.planningUrl) {
      planningState = "unconfigured";
      return;
    }
    planningLoading = true;
    planningError = "";
    try {
      const res = await fetchPlanning(team.planningUrl);
      applyPlanningResult(res);
    } finally {
      planningLoading = false;
    }
  }

  function onRefreshClick() {
    // Si l'autorisation hôte manque, la demander pendant le geste de clic avant tout await (PR-12).
    const permPromise = requestPlanningAccess(team.planningUrl);
    void permPromise.then(() => syncPlanning());
  }

  async function openConfigDialog() {
    configError = "";
    configUrl = team.planningUrl ?? "";
    const auth = await loadPlanningAuth();
    configUsername = auth?.username ?? "";
    configPassword = "";
    showConfigDialog = true;
  }

  function closeConfigDialog() {
    showConfigDialog = false;
    configError = "";
  }

  async function submitConfig(e: SubmitEvent) {
    e.preventDefault();
    const rawUrl = configUrl.trim();
    if (!rawUrl) {
      await team.setPlanningUrl(null);
      planningState = "unconfigured";
      statuses = {};
      closeConfigDialog();
      return;
    }

    // Demander la permission hôte de façon synchrone dans le gestionnaire d'événement,
    // puis attendre explicitement la réponse de l'utilisateur avant tout fetch() (Firefox MV3).
    const permPromise = requestPlanningAccess(rawUrl);

    const urlResult = await team.setPlanningUrl(rawUrl);
    if (!urlResult.ok) {
      configError = urlResult.error;
      return;
    }

    configSaving = true;
    configError = "";
    try {
      const granted = await permPromise;
      if (!granted && !(await hasPlanningAccess(team.planningUrl!))) {
        planningState = "missing_permission";
        configError = "Veuillez autoriser l'accès au serveur du planning dans la popup du navigateur.";
        return;
      }
      const res = await saveConfigAndFetchPlanning(
        team.planningUrl!,
        configUsername,
        configPassword,
      );
      applyPlanningResult(res);
      if (res.state === "auth_failed") {
        configError = "Identifiant ou mot de passe refusé par le planning.";
      } else if (res.state === "auth_required") {
        configError = "Session non connectée : renseignez votre identifiant et mot de passe.";
      } else if (res.state === "missing_permission") {
        configError = "Autorisation d'accès au serveur du planning refusée.";
      } else if (res.state === "error") {
        configError = res.message;
      } else {
        closeConfigDialog();
      }
    } finally {
      configSaving = false;
    }
  }

  onMount(() => {
    void syncPlanning();
  });

  async function start() {
    if (present.length === 0) return;
    // Avant tout await : le navigateur n'accepte la demande que pendant le clic (LI-16).
    const presentSet = new Set(present);
    requestBoardAccess(activeMembers.filter((m) => presentSet.has(m.name)).map((m) => m.link));
    await team.saveAbsents(present);
    onStart(present);
  }
</script>

<div class="view">
  <header>
    <h1>Qui est présent ?</h1>
    <p>Cochez les personnes présentes au daily</p>
  </header>

  {#if activeMembers.length === 0}
    <p class="empty">Aucun membre dans l'équipe. Retournez en arrière pour en ajouter.</p>
  {:else}
    <div class="toggles">
      <button class="toggle on" onclick={() => setAll(true)}>Tout cocher</button>
      <button class="toggle" onclick={() => setAll(false)}>Tout décocher</button>
      {#if planningState === "unconfigured" || planningState === "auth_required" || planningState === "auth_failed"}
        <button
          class="planning-btn"
          class:warn={planningState === "auth_required" || planningState === "auth_failed"}
          onclick={openConfigDialog}
          title="Configurer le planning">
          <Glyph name="key" size={13} />
          {planningState === "auth_failed" ? "Identifiants refusés" : "Planning"}
        </button>
      {:else if planningState === "missing_permission"}
        <button
          class="planning-btn warn"
          onclick={onRefreshClick}
          title="Autoriser l'accès au serveur du planning">
          <Glyph name="refresh" size={13} />
          Autoriser planning
        </button>
      {:else}
        <button
          class="planning-icon-btn"
          onclick={onRefreshClick}
          disabled={planningLoading}
          aria-label="Rafraîchir le planning"
          title={planningState === "error" ? planningError : "Rafraîchir le planning"}>
          <Glyph name="refresh" size={14} />
        </button>
        <button
          class="planning-icon-btn"
          onclick={openConfigDialog}
          aria-label="Configuration du planning"
          title="Configurer le planning">
          <Glyph name="key" size={13} />
        </button>
      {/if}
    </div>
  {/if}

  {#if planningState === "error" && planningError}
    <p class="planning-msg" role="status">{planningError}</p>
  {/if}

  <ul class="list">
    {#each activeMembers as member (member.name)}
      <li class="row" class:off={!checked[member.name]}>
        <label>
          <input type="checkbox" bind:checked={checked[member.name]} />
          <span class="box" aria-hidden="true">
            {#if checked[member.name]}<Glyph name="check" size={13} stroke={3} />{/if}
          </span>
          <MemberIcon {member} size={22} />
          <span class="name">{member.name}</span>
          {#if statuses[member.name]}
            <span class="status" title={statuses[member.name]}>{statuses[member.name]}</span>
          {/if}
        </label>
      </li>
    {/each}
  </ul>

  <p class="count">{present.length}/{activeMembers.length} présents</p>

  <div class="actions">
    <button class="back" onclick={onBack}><Glyph name="back" size={14} /> Retour</button>
    <button class="cta" onclick={start} disabled={present.length === 0}>
      Démarrer le Daily <Glyph name="go" />
    </button>
  </div>
</div>

{#if showConfigDialog}
  <div
    class="backdrop"
    role="button"
    tabindex="-1"
    onclick={closeConfigDialog}
    onkeydown={(e) => e.key === "Escape" && closeConfigDialog()}>
  </div>
  <form class="cred-dialog" aria-label="Configuration du planning" onsubmit={submitConfig}>
    <h2>Configuration du Planning</h2>
    <p class="cred-sub">
      L'adresse est partagée dans le Fichier d'Équipe ; vos identifiants restent locaux.
    </p>
    <label class="field">
      <span>Adresse du planning</span>
      <input
        type="url"
        class="text-input"
        placeholder="http://.../WebplanningRD"
        bind:value={configUrl} />
    </label>
    <label class="field">
      <span>Identifiant (facultatif si déjà connecté)</span>
      <input
        type="text"
        class="text-input"
        bind:value={configUsername}
        autocomplete="username" />
    </label>
    <label class="field">
      <span>Mot de passe</span>
      <input
        type="password"
        class="text-input"
        bind:value={configPassword}
        autocomplete="current-password" />
    </label>
    {#if configError}
      <p class="cred-error">{configError}</p>
    {/if}
    <div class="cred-actions">
      <button type="button" class="ghost" onclick={closeConfigDialog}>Annuler</button>
      <button type="submit" class="primary" disabled={configSaving}>Enregistrer</button>
    </div>
  </form>
{/if}

<style>
  .view {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 16px 12px;
  }

  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
  }

  header p {
    margin: 0;
    font-size: 12px;
    color: var(--txt-dim);
  }

  .empty {
    margin: 0;
    padding: 20px 0;
    text-align: center;
    font-size: 13px;
    color: var(--txt-faint);
  }

  button {
    border: 0;
    border-radius: 6px;
    font: inherit;
    color: var(--txt);
    cursor: pointer;
  }

  .toggles {
    display: flex;
    gap: 8px;
  }

  .toggle {
    flex: 1 1 0;
    height: 30px;
    font-size: 12px;
    font-weight: 600;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
  }

  .toggle.on {
    background: #2a2a4d;
    border-color: transparent;
    color: var(--txt);
  }

  .planning-btn {
    height: 30px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
    white-space: nowrap;
  }

  .planning-btn.warn {
    background: #3a2335;
    border-color: #6d3b5c;
    color: #f5d0fe;
  }

  .planning-icon-btn {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
  }

  .planning-icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .planning-msg {
    margin: -4px 0 0;
    font-size: 11px;
    color: var(--red-txt);
    text-align: center;
  }

  .list {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .row {
    height: 38px;
    flex-shrink: 0;
    border-radius: 8px;
    background: var(--ink-row);
  }

  .row.off {
    background: #1c1c34;
  }

  label {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    cursor: pointer;
  }

  /* La case réelle couvre toute la ligne : c'est elle qui reçoit les clics
     et le focus clavier, la case dessinée n'est qu'un rendu. */
  .row input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .box {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border-radius: 5px;
    border: 1px solid var(--ink-line);
    background: var(--ink-field);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row input:checked + .box {
    background: var(--blue);
    border-color: transparent;
    color: #fff;
  }

  .name {
    flex-grow: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row.off .name {
    color: var(--txt-faint);
  }

  .status {
    flex-shrink: 0;
    max-width: 135px;
    padding: 2px 7px;
    border-radius: 999px;
    background: #2e294e;
    border: 1px solid #483d73;
    color: #d8ccf8;
    font-size: 11px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 18, 0.72);
    border: 0;
  }

  .cred-dialog {
    position: fixed;
    left: 14px;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    border-radius: 12px;
    background: var(--ink);
    border: 1px solid var(--ink-line);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  }

  .cred-dialog h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }

  .cred-sub {
    margin: -4px 0 2px;
    font-size: 11px;
    color: var(--txt-dim);
  }

  .field {
    position: static;
    height: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--txt-dim);
    cursor: default;
  }

  .text-input {
    position: static;
    width: 100%;
    height: 32px;
    padding: 0 9px;
    border-radius: 6px;
    border: 1px solid var(--ink-line);
    background: var(--ink-field);
    color: var(--txt);
    font: inherit;
    font-size: 12px;
    opacity: 1;
    cursor: text;
  }

  .cred-error {
    margin: 0;
    font-size: 11px;
    color: var(--red-txt);
  }

  .cred-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 2px;
  }

  .ghost {
    padding: 0 12px;
    height: 32px;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
    font-size: 12px;
    font-weight: 600;
  }

  .primary {
    padding: 0 14px;
    height: 32px;
    background: var(--blue);
    font-size: 12px;
    font-weight: 700;
  }

  .count {
    margin: 0;
    text-align: center;
    font-size: 12px;
    color: var(--txt-dim);
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .back {
    width: 96px;
    flex-shrink: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    font-size: 13px;
    font-weight: 600;
    color: var(--txt-dim);
  }

  .cta {
    flex-grow: 1;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--blue);
    font-size: 14px;
    font-weight: 800;
  }

  .cta:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
