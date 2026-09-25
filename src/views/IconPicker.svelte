<script lang="ts">
  import { untrack } from "svelte";
  import { EMOJI_GRID } from "../lib/emojis";
  import { team } from "../lib/team.svelte";
  import type { Member } from "../lib/types";

  let { member, onClose }: { member: Member; onClose: () => void } = $props();

  /** Formats proposés en priorité par le sélecteur de fichiers (IC-05). */
  const ACCEPT = ".png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,image/*";

  // Pré-sélection depuis l'Icône actuelle, figée à l'ouverture (IC-03).
  let emoji = $state<string | null>(
    untrack(() => (member.icon?.type === "emoji" ? member.icon.value : null)),
  );
  // Image fraîchement choisie. L'Icône image actuelle n'en est pas une :
  // valider sans rien changer ne doit rien modifier (IC-07).
  let file = $state<File | null>(null);
  let picker = $state<HTMLInputElement | null>(null);

  const fileLabel = $derived(
    file
      ? shorten(file.name)
      : member.icon?.type === "image"
        ? shorten(member.icon.file)
        : "Aucun fichier",
  );

  function shorten(name: string): string {
    return name.length > 28 ? `${name.slice(0, 25)}…` : name;
  }

  function pickEmoji(value: string) {
    emoji = emoji === value ? null : value;
    file = null;
  }

  function onFileChosen(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const chosen = input.files?.[0];
    // Rouvrir le sélecteur sur le même fichier doit redéclencher ce choix.
    input.value = "";
    if (!chosen) return;
    file = chosen;
    emoji = null;
  }

  async function clearIcon() {
    await team.clearIcon(member.name);
    onClose();
  }

  async function confirm() {
    if (file) await team.setImage(member.name, file);
    else if (emoji && !(member.icon?.type === "emoji" && member.icon.value === emoji)) {
      await team.setEmoji(member.name, emoji);
    }
    onClose();
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onClose()} />

<div class="backdrop" aria-hidden="true" onclick={onClose}></div>

<div class="dialog" role="dialog" aria-modal="true" aria-label="Icône — {member.name}">
  <header>
    <h2>Icône — {member.name}</h2>
    <p>Choisissez un emoji ou importez une image</p>
  </header>

  <div class="grid">
    {#each EMOJI_GRID as value (value)}
      <button class="cell" class:selected={emoji === value} onclick={() => pickEmoji(value)}>
        {value}
      </button>
    {/each}
  </div>

  <div class="file">
    <div class="file-text">
      <span class="file-title">Image personnalisée</span>
      <span class="file-name">{fileLabel}</span>
    </div>
    <button class="browse" onclick={() => picker?.click()}>Parcourir…</button>
    <input bind:this={picker} type="file" accept={ACCEPT} hidden onchange={onFileChosen} />
  </div>

  <footer>
    <button class="danger" onclick={clearIcon}>Supprimer l'icône</button>
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

  button {
    border: 0;
    border-radius: 8px;
    font: inherit;
    color: var(--txt);
    cursor: pointer;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 6px;
  }

  .cell {
    aspect-ratio: 1;
    padding: 0;
    background: var(--ink-row);
    font-size: 18px;
    line-height: 1;
  }

  .cell.selected {
    background: #1a5c2a;
    outline: 2px solid #4ade80;
    outline-offset: -2px;
  }

  .file {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--ink-row);
  }

  .file-text {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .file-title {
    font-size: 12px;
    font-weight: 600;
  }

  .file-name {
    font-size: 11px;
    color: var(--txt-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .browse {
    height: 30px;
    flex-shrink: 0;
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
