<script lang="ts">
  import { untrack } from "svelte";
  import { parseLink } from "../lib/link";
  import { activeTabUrl, openLink, requestBoardAccess } from "../lib/tabs";
  import { team } from "../lib/team.svelte";
  import type { Member } from "../lib/types";

  let { member, onClose }: { member: Member; onClose: () => void } = $props();

  const INVALID = "Adresse invalide : elle doit commencer par http:// ou https://.";

  // Pré-rempli avec le Lien actuel, figé à l'ouverture (LI-03).
  let draft = $state(untrack(() => member.link ?? ""));
  let error = $state("");

  async function takeActiveTab() {
    const url = await activeTabUrl().catch(() => null);
    if (url) {
      draft = url;
      error = "";
    } else {
      error = "Cet onglet n'affiche pas une page web.";
    }
  }

  async function test() {
    const link = parseLink(draft);
    if (!link) {
      error = INVALID;
      return;
    }
    requestBoardAccess([link]);
    error = "";
    await openLink(link).catch(() => {});
  }

  async function remove() {
    await team.setLink(member.name, null);
    onClose();
  }

  async function confirm() {
    // Valider un champ vide retire le Lien (LI-06).
    if (!draft.trim()) {
      await remove();
      return;
    }
    const link = parseLink(draft);
    if (!link) {
      error = INVALID;
      return;
    }
    // Avant tout await : le navigateur n'accepte la demande que pendant le clic (LI-16).
    requestBoardAccess([link]);
    if (link !== member.link) await team.setLink(member.name, link);
    onClose();
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onClose()} />

<div class="backdrop" aria-hidden="true" onclick={onClose}></div>

<div class="dialog" role="dialog" aria-modal="true" aria-label="Lien — {member.name}">
  <header>
    <h2>Lien — {member.name}</h2>
    <p>Page affichée quand {member.name} prend la parole</p>
  </header>

  <input
    type="text"
    inputmode="url"
    spellcheck="false"
    autocomplete="off"
    placeholder="https://…"
    bind:value={draft}
    onkeydown={(e) => e.key === "Enter" && confirm()} />

  {#if error}<p class="error">{error}</p>{/if}

  <div class="tools">
    <button class="tool" onclick={takeActiveTab}>Prendre l'onglet actuel</button>
    <button class="tool" onclick={test}>Tester</button>
  </div>
  <p class="hint">
    Astuce : dans Jira, cliquez sur le filtre de la personne, puis sur « Prendre l'onglet actuel ».
  </p>

  <footer>
    <button class="danger" onclick={remove} disabled={!member.link}>Supprimer le lien</button>
    <div class="confirm">
      <button class="ghost" onclick={onClose}>Annuler</button>
      <button class="primary" onclick={confirm}>Valider</button>
    </div>
  </footer>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 18, 0.7);
  }

  .dialog {
    position: fixed;
    inset: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: 12px;
    background: var(--ink);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
  }

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  header p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--txt-dim);
  }

  input {
    height: 36px;
    min-width: 0;
    border-radius: 6px;
    border: 1px solid var(--ink-line);
    background: var(--ink-field);
    color: var(--txt);
    padding: 0 10px;
    font: inherit;
    font-size: 12px;
  }

  input::placeholder {
    color: var(--txt-faint);
  }

  .error {
    margin: 0;
    font-size: 11px;
    color: #ff8f9b;
  }

  .hint {
    margin: 0;
    font-size: 11px;
    color: var(--txt-faint);
  }

  button {
    border: 0;
    border-radius: 8px;
    font: inherit;
    color: var(--txt);
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tool {
    flex: 1 1 auto;
    height: 32px;
    padding: 0 12px;
    background: #30305a;
    font-size: 12px;
    font-weight: 600;
  }

  /* Dans un panneau étroit, Annuler et Valider passent ensemble à la ligne (PA-05). */
  footer {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .confirm {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }

  .danger {
    height: 34px;
    padding: 0 12px;
    background: var(--red);
    color: var(--red-txt);
    font-size: 12px;
    font-weight: 600;
  }

  .ghost {
    width: 80px;
    height: 34px;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
    font-size: 13px;
    font-weight: 600;
  }

  .primary {
    width: 80px;
    height: 34px;
    background: var(--blue);
    font-size: 13px;
    font-weight: 700;
  }
</style>
