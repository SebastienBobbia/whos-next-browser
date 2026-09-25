<script lang="ts">
  import Glyph from "../lib/Glyph.svelte";
  import MemberIcon from "../lib/MemberIcon.svelte";
  import { team } from "../lib/team.svelte";
  import { parseTeamFile, teamFileName, type FileMember } from "../lib/team-file";
  import type { Member } from "../lib/types";
  import ConfirmDialog from "./ConfirmDialog.svelte";

  let {
    onPrepare,
    onEditIcon,
    onEditLink,
  }: { onPrepare: () => void; onEditIcon: (m: Member) => void; onEditLink: (m: Member) => void } =
    $props();

  let draft = $state("");
  let error = $state("");
  let dragFrom = $state<number | null>(null);
  let dropAt = $state<number | null>(null);
  let importPicker = $state<HTMLInputElement | null>(null);
  let fileError = $state("");
  /** Fichier d'Équipe lu, en attente de confirmation du remplacement (FI-04). */
  let pending = $state<FileMember[] | null>(null);

  const count = $derived(team.members.length);

  function members(n: number): string {
    return `${n} membre${n > 1 ? "s" : ""}`;
  }

  /** Télécharge le Fichier d'Équipe par le téléchargement habituel du navigateur (FI-02). */
  async function exportTeam() {
    const blob = new Blob([await team.exportFile()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = teamFileName(new Date());
    anchor.click();
    // Firefox lit encore l'adresse juste après le clic : on la libère plus tard.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function onImportChosen(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    // Rouvrir le sélecteur sur le même fichier doit redéclencher l'import.
    input.value = "";
    if (!file) return;
    const incoming = parseTeamFile(await file.text());
    if (!incoming) {
      fileError = "Ce fichier n'est pas un Fichier d'Équipe valide.";
      return;
    }
    fileError = "";
    // Une Équipe vide est remplacée sans confirmation (FI-04).
    if (count === 0) await team.replaceWith(incoming);
    else pending = incoming;
  }

  async function confirmImport() {
    const incoming = pending;
    pending = null;
    if (incoming) await team.replaceWith(incoming);
  }

  async function add() {
    const result = await team.add(draft);
    if (result.ok) {
      draft = "";
      error = "";
    } else {
      error = result.error;
    }
  }

  /** Le clic en cours a commencé sur un bouton de la ligne : pas de glisser (EQ-15). */
  let pressedOnButton = false;

  function onDragStart(event: DragEvent, index: number) {
    if (pressedOnButton) {
      event.preventDefault();
      return;
    }
    dragFrom = index;
    // Firefox ne démarre pas un glisser-déposer sans données attachées.
    event.dataTransfer?.setData("text/plain", team.members[index]?.name ?? "");
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    const row = event.currentTarget as HTMLElement;
    const middle = row.getBoundingClientRect().top + row.offsetHeight / 2;
    dropAt = event.clientY < middle ? index : index + 1;
  }

  async function onDrop(event: DragEvent) {
    // Sans cela, Firefox tente d'ouvrir le texte déposé.
    event.preventDefault();
    if (dragFrom !== null && dropAt !== null) await team.reorder(dragFrom, dropAt);
    dragFrom = null;
    dropAt = null;
  }
</script>

<div class="view">
  <header>
    <h1>Gestion de l'équipe</h1>
    <p>Ajoutez les membres permanents de votre équipe</p>
  </header>

  <div class="add">
    <input
      type="text"
      bind:value={draft}
      placeholder="Nom du membre..."
      onkeydown={(e) => e.key === "Enter" && add()} />
    <button class="primary" onclick={add}>Ajouter</button>
  </div>

  {#if error}<p class="error">{error}</p>{/if}
  {#if count > 0}<p class="hint">Maintenir et glisser pour réordonner</p>{/if}

  <ul class="list" ondragover={(e) => e.preventDefault()} ondrop={onDrop}>
    {#if count === 0}
      <li class="empty">Aucun membre. Ajoutez des personnes ci-dessus ou importez un Fichier d'Équipe.</li>
    {/if}
    {#each team.members as member, index (member.name)}
      {#if dropAt === index}<li class="marker"></li>{/if}
      <li
        class="row"
        class:dragging={dragFrom === index}
        draggable="true"
        onpointerdown={(e) => (pressedOnButton = !!(e.target as Element).closest("button"))}
        ondragstart={(e) => onDragStart(e, index)}
        ondragover={(e) => onDragOver(e, index)}
        ondragend={() => ((dragFrom = null), (dropAt = null))}>
        <span class="handle"><Glyph name="handle" /></span>
        <MemberIcon {member} size={24} />
        <span class="name">{index + 1}. {member.name}</span>
        <button class="icon-btn" title="Icône" onclick={() => onEditIcon(member)}>
          {#if member.icon?.type === "emoji"}
            <span class="btn-emoji">{member.icon.value}</span>
          {:else if member.icon?.type === "image"}
            <Glyph name="image" size={14} />
          {:else}
            <Glyph name="plus" size={14} />
          {/if}
        </button>
        <button
          class="link-btn"
          class:set={!!member.link}
          title={member.link ?? "Lien"}
          onclick={() => onEditLink(member)}>
          <Glyph name="link" size={14} />
        </button>
        <button class="del-btn" title="Supprimer" onclick={() => team.remove(member.name)}>
          <Glyph name="close" size={14} />
        </button>
      </li>
    {/each}
    {#if dropAt === count}<li class="marker"></li>{/if}
  </ul>

  <p class="count">{members(count)} dans l'équipe</p>

  <div class="files">
    <button class="file-btn" onclick={() => importPicker?.click()}>Importer</button>
    <button class="file-btn" onclick={exportTeam} disabled={count === 0}>Exporter</button>
    <input
      bind:this={importPicker}
      type="file"
      accept=".json,application/json"
      hidden
      onchange={onImportChosen} />
  </div>
  {#if fileError}<p class="error">{fileError}</p>{/if}

  <button class="cta" onclick={onPrepare} disabled={count === 0}>
    Préparer le Daily <Glyph name="go" />
  </button>
</div>

{#if pending}
  <ConfirmDialog
    message="Remplacer l'équipe actuelle ({members(count)}) par celle du fichier ({members(pending.length)}) ?"
    confirmLabel="Remplacer"
    onConfirm={confirmImport}
    onCancel={() => (pending = null)} />
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

  .add {
    display: flex;
    gap: 8px;
  }

  input {
    flex-grow: 1;
    min-width: 0;
    height: 36px;
    border-radius: 6px;
    border: 1px solid var(--ink-line);
    background: var(--ink-field);
    color: var(--txt);
    padding: 0 10px;
    font: inherit;
    font-size: 13px;
  }

  input::placeholder {
    color: var(--txt-faint);
  }

  button {
    border: 0;
    border-radius: 6px;
    font: inherit;
    color: var(--txt);
    cursor: pointer;
  }

  .primary {
    width: 90px;
    flex-shrink: 0;
    height: 36px;
    background: var(--blue);
    font-size: 13px;
    font-weight: 600;
  }

  .error {
    margin: 0;
    text-align: center;
    font-size: 11px;
    color: #ff8f9b;
  }

  .hint,
  .count {
    margin: 0;
    text-align: center;
    font-size: 11px;
    color: var(--txt-faint);
  }

  .count {
    font-size: 12px;
    color: var(--txt-dim);
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

  .empty {
    padding: 20px 0;
    text-align: center;
    font-size: 13px;
    color: var(--txt-faint);
  }

  .marker {
    height: 3px;
    border-radius: 2px;
    background: #4ade80;
    flex-shrink: 0;
  }

  .row {
    height: 40px;
    flex-shrink: 0;
    border-radius: 8px;
    background: var(--ink-row);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
  }

  .row.dragging {
    background: #1a5c2a;
  }

  .handle {
    display: flex;
    color: var(--txt-faint);
    cursor: grab;
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

  .icon-btn,
  .link-btn,
  .del-btn {
    width: 30px;
    height: 26px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #30305a;
    color: #c9c8e0;
  }

  /* Lien : estompé tant qu'il n'existe pas, mis en valeur ensuite (LI-01). */
  .link-btn {
    color: var(--txt-faint);
    background: transparent;
    border: 1px solid var(--ink-line);
  }

  .link-btn.set {
    color: #fff;
    background: var(--blue);
    border-color: transparent;
  }

  .btn-emoji {
    font-size: 13px;
    line-height: 1;
  }

  .del-btn {
    background: var(--red);
    color: var(--red-txt);
  }

  .files {
    display: flex;
    gap: 8px;
  }

  .file-btn {
    flex: 1 1 0;
    height: 30px;
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
    font-size: 12px;
    font-weight: 600;
  }

  .file-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .cta {
    height: 40px;
    flex-shrink: 0;
    background: var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 800;
  }

  .cta:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
